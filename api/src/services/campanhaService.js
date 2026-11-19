'use strict';

const { getDb } = require('../config/database');
const CampanhaModel = require('../models/CampanhaModel');
const NumeroModel = require('../models/NumeroModel');
const ParticipanteModel = require('../models/ParticipanteModel');
const { gerarIntervalo, validarQuantidades } = require('../utils/helpers');
const { AppError } = require('../utils/AppError');

async function criarCampanha({ nome, numero_inicial, numero_final, todos_premiados }) {
  numero_inicial = parseInt(numero_inicial, 10);
  numero_final = parseInt(numero_final, 10);
  if (numero_inicial > numero_final) throw new AppError('numero_inicial deve ser menor ou igual a numero_final.', 400);
  const campanha = await CampanhaModel.create({
    nome,
    numero_inicial,
    numero_final,
    todos_premiados: !!todos_premiados,
    status: 'em_preparacao'
  });
  await NumeroModel.inserirLote(campanha.id, gerarIntervalo(numero_inicial, numero_final));
  return campanha;
}

async function editarCampanha(id, { nome, numero_inicial, numero_final, todos_premiados }) {
  const campanha = await buscarCampanha(id);
  if (campanha.status !== 'em_preparacao') {
    throw new AppError('Só é possível editar campanhas em preparação.', 422);
  }

  // Se houver tentativa de alterar intervalo numérico, validar se já existem sorteios
  const temSorteios = await getDb()('sorteios').where({ campanha_id: id }).count('id as c').first();
  if (parseInt(temSorteios.c, 10) > 0 && (numero_inicial !== undefined || numero_final !== undefined)) {
    throw new AppError('Não é possível alterar o intervalo após a realização de sorteios.', 422);
  }

  const novoInicio = numero_inicial !== undefined ? parseInt(numero_inicial, 10) : campanha.numero_inicial;
  const novoFim = numero_final !== undefined ? parseInt(numero_final, 10) : campanha.numero_final;
  if (novoInicio > novoFim) {
    throw new AppError('numero_inicial deve ser menor ou igual a numero_final.', 400);
  }

  const intervaloAlterado = (novoInicio !== campanha.numero_inicial || novoFim !== campanha.numero_final);
  if (intervaloAlterado) {
    await NumeroModel.deleteByCampanha(id);
    await NumeroModel.inserirLote(id, gerarIntervalo(novoInicio, novoFim));
  }

  return CampanhaModel.update(id, {
    nome: nome !== undefined ? nome.trim() : campanha.nome,
    numero_inicial: novoInicio,
    numero_final: novoFim,
    todos_premiados: todos_premiados !== undefined ? !!todos_premiados : campanha.todos_premiados,
  });
}

async function listarCampanhas() {
  return CampanhaModel.findAll();
}

async function buscarCampanha(id) {
  const c = await CampanhaModel.findById(id);
  if (!c) throw new AppError('Campanha não encontrada.', 404);
  return c;
}

async function conferirCampanha(id) {
  const campanha = await buscarCampanha(id);
  const totalNumeros = await NumeroModel.countTotal(id);
  const numerosDisponiveis = await NumeroModel.countDisponiveis(id);
  const numerosSorteados = await NumeroModel.countSorteados(id);
  const totalParticipantes = await ParticipanteModel.countTotal(id);
  const participantesDisponiveis = await ParticipanteModel.countDisponiveis(id);
  const participantesSorteados = await ParticipanteModel.countSorteados(id);
  const diferenca = totalNumeros - totalParticipantes;

  const { valido, mensagem } = validarQuantidades({
    todosPremiados: !!campanha.todos_premiados,
    totalNumeros,
    totalParticipantes
  });

  return {
    campanha_id: id,
    todos_premiados: !!campanha.todos_premiados,
    numeros: {
      total: totalNumeros,
      disponiveis: numerosDisponiveis,
      sorteados: numerosSorteados
    },
    participantes: {
      total: totalParticipantes,
      disponiveis: participantesDisponiveis,
      sorteados: participantesSorteados
    },
    diferenca_numeros_participantes: diferenca,
    compativel: valido,
    situacao_compatibilidade: valido ? 'compativel' : 'incompativel',
    mensagem: mensagem || 'Configuração compatível.'
  };
}

async function atualizarStatus(id, novoStatus) {
  const campanha = await buscarCampanha(id);
  const transicoesValidas = {
    em_preparacao: ['ativa', 'cancelada'],
    ativa: ['finalizada', 'cancelada'],
    finalizada: [],
    cancelada: []
  };

  if (!transicoesValidas[campanha.status] || !transicoesValidas[campanha.status].includes(novoStatus)) {
    throw new AppError(`Transição de status '${campanha.status}' para '${novoStatus}' não é permitida.`, 422);
  }

  // Ao ativar, executar a conferência obrigatória
  if (novoStatus === 'ativa' && campanha.todos_premiados) {
    const totalNumeros = await NumeroModel.countDisponiveis(id);
    const totalParticipantes = await ParticipanteModel.countDisponiveis(id);
    const { valido, mensagem } = validarQuantidades({
      todosPremiados: true,
      totalNumeros,
      totalParticipantes
    });
    if (!valido) throw new AppError(mensagem, 422);
  }

  return CampanhaModel.updateStatus(id, novoStatus);
}

/**
 * Exclui permanentemente uma campanha finalizada e todos os seus dados dependentes
 * em transação atômica MySQL.
 */
async function excluirCampanhaFinalizada(id) {
  const db = getDb();

  return db.transaction(async (trx) => {
    const campanha = await trx('campanhas').where({ id }).forUpdate().first();
    if (!campanha) throw new AppError('Campanha não encontrada.', 404);

    if (campanha.status !== 'finalizada') {
      throw new AppError(
        `Apenas campanhas com situação 'finalizada' podem ser excluídas (situação atual: ${campanha.status}).`,
        422
      );
    }

    // 1. Excluir histórico de sorteios vinculados
    await trx('sorteios').where({ campanha_id: id }).delete();

    // 2. Excluir números gerados vinculados
    await trx('numeros').where({ campanha_id: id }).delete();

    // 3. Excluir participantes vinculados
    await trx('participantes').where({ campanha_id: id }).delete();

    // 4. Excluir o registro da campanha
    await trx('campanhas').where({ id }).delete();

    return {
      message: 'Campanha e todos os dados associados foram excluídos com sucesso.',
      id
    };
  });
}

/**
 * Reativa uma campanha finalizada através de uma das opções obrigatórias:
 * - 'zerar': Cancela sorteios ativos no histórico com motivo de reinício, libera participantes e números, e volta status para 'ativa'.
 * - 'continuar': Preserva todos os sorteios, participantes e números bloqueados exatamente como estão, e volta status para 'ativa'.
 */
async function reativarCampanhaFinalizada(id, opcao) {
  if (!opcao || (opcao !== 'zerar' && opcao !== 'continuar')) {
    throw new AppError('Opção de reativação inválida. Escolha "zerar" ou "continuar".', 400);
  }

  const db = getDb();

  return db.transaction(async (trx) => {
    const campanha = await trx('campanhas').where({ id }).forUpdate().first();
    if (!campanha) throw new AppError('Campanha não encontrada.', 404);

    if (campanha.status === 'ativa') {
      throw new AppError('Esta campanha já está ativa.', 422);
    }

    if (campanha.status !== 'finalizada') {
      throw new AppError(
        `Apenas campanhas com situação 'finalizada' podem ser reativadas (situação atual: ${campanha.status}).`,
        422
      );
    }

    if (opcao === 'zerar') {
      // 1. Cancelar sorteios confirmados no histórico (NUNCA apaga do histórico)
      await trx('sorteios')
        .where({ campanha_id: id, status: 'confirmado' })
        .update({
          status: 'cancelado',
          cancelado_em: new Date(),
          motivo_cancelamento: 'Campanha reiniciada: sorteio cancelado para novo ciclo completo',
          updated_at: new Date(),
        });

      // 2. Liberar todos os participantes
      await trx('participantes')
        .where({ campanha_id: id })
        .update({
          status: 'disponivel',
          updated_at: new Date(),
        });

      // 3. Liberar todos os números
      await trx('numeros')
        .where({ campanha_id: id })
        .update({
          status: 'disponivel',
          updated_at: new Date(),
        });

      // 4. Alterar status da campanha para ativa
      await trx('campanhas')
        .where({ id })
        .update({
          status: 'ativa',
          updated_at: new Date(),
        });
    } else {
      // Opção 'continuar': preserva exatamente todos os dados e bloqueios anteriores
      await trx('campanhas')
        .where({ id })
        .update({
          status: 'ativa',
          updated_at: new Date(),
        });
    }

    return trx('campanhas').where({ id }).first();
  });
}

module.exports = {
  criarCampanha,
  editarCampanha,
  listarCampanhas,
  buscarCampanha,
  atualizarStatus,
  conferirCampanha,
  excluirCampanhaFinalizada,
  reativarCampanhaFinalizada,
};
