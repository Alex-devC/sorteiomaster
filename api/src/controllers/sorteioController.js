'use strict';

const {
  realizarSorteio,
  cancelarSorteio,
  reativarSorteio,
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
    const { status, participante_id, numero, busca, participante } = req.query;

    let statusDb = status;
    if (status === 'realizado' || status === 'ativo') {
      statusDb = 'confirmado';
    }

    const resultado = await listarSorteios(campanha_id, {
      status: statusDb,
      participante_id: participante_id ? parseInt(participante_id, 10) : undefined,
      numero: numero !== undefined && numero !== '' ? parseInt(numero, 10) : undefined,
      busca: busca || participante || undefined
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

async function reativar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await reativarSorteio(id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  realizar,
  cancelar,
  reativar,
  listar,
  buscar
};
