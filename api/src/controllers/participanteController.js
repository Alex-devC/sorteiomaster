'use strict';

const {
  adicionarParticipante,
  editarParticipante,
  excluirParticipante,
  listarParticipantes,
  buscarParticipante,
  listarDisponiveis
} = require('../services/participanteService');

async function adicionar(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const resultado = await adicionarParticipante(campanha_id, req.body.nome);
    return res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function editar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await editarParticipante(id, req.body.nome);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function excluir(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await excluirParticipante(id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const { status, busca } = req.query;
    const resultado = await listarParticipantes(campanha_id, { status, busca });
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function buscar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await buscarParticipante(id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listarDisponivelController(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const resultado = await listarDisponiveis(campanha_id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  adicionar,
  editar,
  excluir,
  listar,
  buscar,
  listarDisponivelController
};
