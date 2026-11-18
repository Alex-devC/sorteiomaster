'use strict';

const {
  criarCampanha,
  editarCampanha,
  listarCampanhas,
  buscarCampanha,
  atualizarStatus,
  conferirCampanha
} = require('../services/campanhaService');

async function criar(req, res, next) {
  try {
    const { nome, numero_inicial, numero_final, todos_premiados } = req.body;
    const resultado = await criarCampanha({ nome, numero_inicial, numero_final, todos_premiados });
    return res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function editar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await editarCampanha(id, req.body);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    const resultado = await listarCampanhas();
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function buscar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await buscarCampanha(id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function alterarStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const resultado = await atualizarStatus(id, status);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function conferir(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await conferirCampanha(id);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  criar,
  editar,
  listar,
  buscar,
  alterarStatus,
  conferir
};
