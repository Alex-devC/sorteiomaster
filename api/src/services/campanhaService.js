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

module.exports = {
  criarCampanha,
  editarCampanha,
  listarCampanhas,
  buscarCampanha,
  atualizarStatus,
  conferirCampanha
};
