'use strict';

const NumeroModel = require('../models/NumeroModel');
const CampanhaModel = require('../models/CampanhaModel');
const { AppError } = require('../utils/AppError');

async function listarNumeros(campanha_id, { status } = {}) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);
  return NumeroModel.findByCampanha(campanha_id, { status });
}

async function buscarNumero(id) {
  const n = await NumeroModel.findById(id);
  if (!n) throw new AppError('Número não encontrado.', 404);
  return n;
}

async function estatisticasNumeros(campanha_id) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);
  const total = await NumeroModel.countTotal(campanha_id);
  const disponiveis = await NumeroModel.countDisponiveis(campanha_id);
  const sorteados = await NumeroModel.countSorteados(campanha_id);
  return { total, disponiveis, sorteados };
}

module.exports = {
  listarNumeros,
  buscarNumero,
  estatisticasNumeros
};
