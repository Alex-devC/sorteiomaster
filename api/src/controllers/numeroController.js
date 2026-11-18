'use strict';

const {
  listarNumeros,
  buscarNumero,
  estatisticasNumeros
} = require('../services/numeroService');

async function listar(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const { status } = req.query;
    const resultado = await listarNumeros(campanha_id, { status });
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function buscar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await buscarNumero(id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function estatisticas(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const resultado = await estatisticasNumeros(campanha_id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listar,
  buscar,
  estatisticas
};
