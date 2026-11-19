'use strict';

const crypto = require('crypto');
const { getDb } = require('../config/database');
const CampanhaModel = require('../models/CampanhaModel');
const { AppError } = require('../utils/AppError');

/**
 * Realiza sorteio: o operador seleciona o participante disponível.
 * Se o parâmetro numero_id for fornecido (ex: testes legados de integridade),
 * ele é validado e utilizado. Caso contrário, a API escolhe o número vencedor
 * de forma estritamente aleatória via crypto.randomInt (CSPRNG), com bloqueio
 * transacional de concorrência e SELECT FOR UPDATE.
 */
async function realizarSorteio(campanha_id, participante_id, numero_id = null) {
  const db = getDb();

  return db.transaction(async (trx) => {
    // 1. Validar campanha
    const campanha = await trx('campanhas').where({ id: campanha_id }).first();
    if (!campanha) throw new AppError('Campanha não encontrada.', 404);
    if (campanha.status !== 'ativa') {
      throw new AppError('Sorteios só podem ser realizados em campanhas ativas.', 422);
    }

    // 2. Bloquear participante para leitura exclusiva
    const participante = await trx('participantes')
      .where({ id: participante_id, campanha_id })
      .forUpdate()
      .first();
    if (!participante) throw new AppError('Participante não encontrado nesta campanha.', 404);
    if (participante.status !== 'disponivel') {
      throw new AppError('Participante não está disponível para sorteio.', 422);
    }

    // 3. Garantir que o participante não possui resultado confirmado ativo
    const jaSorteado = await trx('sorteios')
      .where({ participante_id, status: 'confirmado' })
      .first();
    if (jaSorteado) {
      throw new AppError('Este participante já possui um resultado ativo.', 409);
    }

    let idNumeroEscolhido = null;

    if (numero_id) {
      // Caso seja passado explicitamente (ex: testes unitários ou simulação específica)
      const numero = await trx('numeros')
        .where({ id: numero_id, campanha_id })
        .forUpdate()
        .first();
      if (!numero) throw new AppError('Número não encontrado nesta campanha.', 404);
      if (numero.status !== 'disponivel') {
        throw new AppError('Número não está disponível.', 422);
      }
      idNumeroEscolhido = numero.id;
    } else {
      // Fluxo padrão obrigatório da roleta: API escolhe aleatoriamente via CSPRNG
      const numerosDisponiveis = await trx('numeros')
        .where({ campanha_id, status: 'disponivel' })
        .forUpdate()
        .select('id');
      if (!numerosDisponiveis || numerosDisponiveis.length === 0) {
        throw new AppError('Não há números disponíveis para sorteio nesta campanha.', 422);
      }

      const indice = crypto.randomInt(0, numerosDisponiveis.length);
      idNumeroEscolhido = numerosDisponiveis[indice].id;
    }

    // 4. Verificar se o número já tem resultado ativo (dupla verificação de integridade)
    const numeroAtivo = await trx('sorteios')
      .where({ numero_id: idNumeroEscolhido, status: 'confirmado' })
      .first();
    if (numeroAtivo) {
      throw new AppError('Número sorteado já possui resultado ativo.', 409);
    }

    // 5. Registrar sorteio confirmado
    const [id] = await trx('sorteios').insert({
      campanha_id,
      participante_id,
      numero_id: idNumeroEscolhido,
      status: 'confirmado',
      sorteado_em: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 6. Marcar participante e número como sorteados
    await trx('participantes')
      .where({ id: participante_id })
      .update({ status: 'sorteado', updated_at: new Date() });

    await trx('numeros')
      .where({ id: idNumeroEscolhido })
      .update({ status: 'sorteado', updated_at: new Date() });

    // 7. Retornar dados completos do sorteio
    return trx('sorteios as s')
      .join('participantes as p', 's.participante_id', 'p.id')
      .join('numeros as n', 's.numero_id', 'n.id')
      .where('s.id', id)
      .select(
        's.id',
        's.campanha_id',
        's.participante_id',
        's.numero_id',
        's.status',
        's.sorteado_em',
        's.cancelado_em',
        's.motivo_cancelamento',
        'p.nome as participante_nome',
        'n.numero as numero_sorteado'
      )
      .first();
  });
}

/**
 * Cancela um sorteio:
 * Preserva o histórico do sorteio e libera exatamente o participante e o número associados.
 */
async function cancelarSorteio(id, motivo_cancelamento) {
  if (!motivo_cancelamento || typeof motivo_cancelamento !== 'string' || motivo_cancelamento.trim().length === 0) {
    throw new AppError('O motivo do cancelamento é obrigatório.', 422);
  }

  const motivoFormatado = motivo_cancelamento.trim();
  const db = getDb();

  return db.transaction(async (trx) => {
    const sorteio = await trx('sorteios').where({ id }).forUpdate().first();
    if (!sorteio) throw new AppError('Sorteio não encontrado.', 404);
    if (sorteio.status === 'cancelado') {
      throw new AppError('Este sorteio já está cancelado.', 422);
    }

    await trx('sorteios').where({ id }).update({
      status: 'cancelado',
      cancelado_em: new Date(),
      motivo_cancelamento: motivoFormatado,
      updated_at: new Date(),
    });

    // Liberar participante e número exatos associados àquele sorteio
    await trx('participantes')
      .where({ id: sorteio.participante_id })
      .update({ status: 'disponivel', updated_at: new Date() });

    await trx('numeros')
      .where({ id: sorteio.numero_id })
      .update({ status: 'disponivel', updated_at: new Date() });

    return trx('sorteios as s')
      .join('participantes as p', 's.participante_id', 'p.id')
      .join('numeros as n', 's.numero_id', 'n.id')
      .where('s.id', id)
      .select(
        's.id',
        's.campanha_id',
        's.participante_id',
        's.numero_id',
        's.status',
        's.sorteado_em',
        's.cancelado_em',
        's.motivo_cancelamento',
        'p.nome as participante_nome',
        'n.numero as numero_sorteado'
      )
      .first();
  });
}

/**
 * Reativa um sorteio previamente cancelado:
 * - Valida se o sorteio existe e está cancelado.
 * - Valida se a campanha não está cancelada.
 * - Valida se o participante e o número originais estão disponíveis.
 * - Impede a operação se o participante ou número já possuir outro sorteio ativo.
 * - Executa atomicamente em transação com bloqueio forUpdate().
 */
async function reativarSorteio(id) {
  const db = getDb();

  return db.transaction(async (trx) => {
    // 1. Bloquear e validar o sorteio
    const sorteio = await trx('sorteios').where({ id }).forUpdate().first();
    if (!sorteio) throw new AppError('Sorteio não encontrado.', 404);
    if (sorteio.status === 'confirmado') {
      throw new AppError('Este sorteio já está ativo.', 422);
    }

    // 2. Validar campanha
    const campanha = await trx('campanhas').where({ id: sorteio.campanha_id }).first();
    if (!campanha) throw new AppError('Campanha associada não encontrada.', 404);
    if (campanha.status === 'cancelada') {
      throw new AppError('Não é possível reativar sorteios de uma campanha cancelada.', 422);
    }

    // 3. Bloquear e validar participante original
    const participante = await trx('participantes')
      .where({ id: sorteio.participante_id, campanha_id: sorteio.campanha_id })
      .forUpdate()
      .first();
    if (!participante) throw new AppError('Participante associado ao sorteio não encontrado.', 404);

    if (participante.status !== 'disponivel') {
      throw new AppError(
        `Não é possível reativar: o participante "${participante.nome}" não está disponível (situação: ${participante.status}).`,
        422
      );
    }

    // Garantir que o participante não possui nenhum outro sorteio ativo na campanha
    const partComSorteioAtivo = await trx('sorteios')
      .where({ participante_id: sorteio.participante_id, status: 'confirmado' })
      .whereNot({ id })
      .first();
    if (partComSorteioAtivo) {
      throw new AppError(
        `Não é possível reativar: o participante "${participante.nome}" já possui outro sorteio ativo nesta campanha.`,
        409
      );
    }

    // 4. Bloquear e validar número original
    const numero = await trx('numeros')
      .where({ id: sorteio.numero_id, campanha_id: sorteio.campanha_id })
      .forUpdate()
      .first();
    if (!numero) throw new AppError('Número associado ao sorteio não encontrado.', 404);

    if (numero.status !== 'disponivel') {
      throw new AppError(
        `Não é possível reativar: o número ${numero.numero} não está disponível (situação: ${numero.status}).`,
        422
      );
    }

    // Garantir que o número não possui nenhum outro sorteio ativo na campanha
    const numComSorteioAtivo = await trx('sorteios')
      .where({ numero_id: sorteio.numero_id, status: 'confirmado' })
      .whereNot({ id })
      .first();
    if (numComSorteioAtivo) {
      throw new AppError(
        `Não é possível reativar: o número ${numero.numero} já possui outro sorteio ativo nesta campanha.`,
        409
      );
    }

    // 5. Reativar sorteio
    await trx('sorteios').where({ id }).update({
      status: 'confirmado',
      cancelado_em: null,
      updated_at: new Date(),
    });

    // 6. Bloquear novamente o participante e número originais
    await trx('participantes')
      .where({ id: sorteio.participante_id })
      .update({ status: 'sorteado', updated_at: new Date() });

    await trx('numeros')
      .where({ id: sorteio.numero_id })
      .update({ status: 'sorteado', updated_at: new Date() });

    // 7. Retornar dados do sorteio reativado
    return trx('sorteios as s')
      .join('participantes as p', 's.participante_id', 'p.id')
      .join('numeros as n', 's.numero_id', 'n.id')
      .where('s.id', id)
      .select(
        's.id',
        's.campanha_id',
        's.participante_id',
        's.numero_id',
        's.status',
        's.sorteado_em',
        's.cancelado_em',
        's.motivo_cancelamento',
        'p.nome as participante_nome',
        'n.numero as numero_sorteado'
      )
      .first();
  });
}

async function listarSorteios(campanha_id, { status, participante_id, numero, busca } = {}) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);

  let q = getDb()('sorteios as s')
    .join('participantes as p', 's.participante_id', 'p.id')
    .join('numeros as n', 's.numero_id', 'n.id')
    .where('s.campanha_id', campanha_id)
    .select(
      's.id',
      's.campanha_id',
      's.participante_id',
      's.numero_id',
      's.status',
      's.sorteado_em',
      's.cancelado_em',
      's.motivo_cancelamento',
      'p.nome as participante_nome',
      'n.numero as numero_sorteado'
    );

  if (status) {
    const statusVal = (status === 'realizado' || status === 'ativo') ? 'confirmado' : status;
    q = q.where('s.status', statusVal);
  }
  if (participante_id) q = q.where('s.participante_id', participante_id);
  if (numero !== undefined && numero !== null) q = q.where('n.numero', numero);
  if (busca && busca.trim() !== '') {
    q = q.where('p.nome', 'like', `%${busca.trim()}%`);
  }

  return q.orderBy('s.sorteado_em', 'desc');
}

async function buscarSorteio(id) {
  const s = await getDb()('sorteios as s')
    .join('participantes as p', 's.participante_id', 'p.id')
    .join('numeros as n', 's.numero_id', 'n.id')
    .where('s.id', id)
    .select(
      's.id',
      's.campanha_id',
      's.participante_id',
      's.numero_id',
      's.status',
      's.sorteado_em',
      's.cancelado_em',
      's.motivo_cancelamento',
      'p.nome as participante_nome',
      'n.numero as numero_sorteado'
    )
    .first();

  if (!s) throw new AppError('Sorteio não encontrado.', 404);
  return s;
}

module.exports = {
  realizarSorteio,
  cancelarSorteio,
  reativarSorteio,
  listarSorteios,
  buscarSorteio
};
