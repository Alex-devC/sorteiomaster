'use strict';

const {
  realizarSorteio,
  cancelarSorteio,
  listarSorteios,
  buscarSorteio
} = require('../services/sorteioService');

async function realizar(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const { participante_id, numero_id } = req.body;
    const numId = numero_id ? parseInt(numero_id, 10) : null;
    const resultado = await realizarSorteio(campanha_id, parseInt(participante_id, 10), numId);
    return res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function cancelar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { motivo_cancelamento } = req.body;
    const resultado = await cancelarSorteio(id, motivo_cancelamento);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const { status, participante_id, numero } = req.query;
    const resultado = await listarSorteios(campanha_id, {
      status,
      participante_id: participante_id ? parseInt(participante_id, 10) : undefined,
      numero: numero !== undefined && numero !== '' ? parseInt(numero, 10) : undefined
    });
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function buscar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await buscarSorteio(id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  realizar,
  cancelar,
  listar,
  buscar
};
