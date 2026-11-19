'use strict';

const usuarioService = require('../services/usuarioService');

async function listar(req, res, next) {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    return res.status(200).json(usuarios);
  } catch (err) {
    next(err);
  }
}

async function buscar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const usuario = await usuarioService.buscarUsuario(id);
    return res.status(200).json(usuario);
  } catch (err) {
    next(err);
  }
}

async function cadastrar(req, res, next) {
  try {
    const { nome, usuario, senha, ativo, permissoes } = req.body;
    const novoUsuario = await usuarioService.cadastrarUsuario({
      nome,
      usuario,
      senha,
      ativo,
      permissoes
    });
    return res.status(201).json(novoUsuario);
  } catch (err) {
    next(err);
  }
}

async function editar(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, usuario, ativo, permissoes } = req.body;
    const usuarioAutenticadoId = req.usuario?.sub;
    const atualizado = await usuarioService.editarUsuario(
      id,
      { nome, usuario, ativo, permissoes },
      usuarioAutenticadoId
    );
    return res.status(200).json(atualizado);
  } catch (err) {
    next(err);
  }
}

async function alterarSenha(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { nova_senha } = req.body;
    const atualizado = await usuarioService.alterarSenha(id, nova_senha);
    return res.status(200).json({ message: 'Senha atualizada com sucesso.', id: atualizado.id });
  } catch (err) {
    next(err);
  }
}

async function alterarStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { ativo } = req.body;
    const usuarioAutenticadoId = req.usuario?.sub;
    const atualizado = await usuarioService.alterarStatusUsuario(id, ativo, usuarioAutenticadoId);
    return res.status(200).json(atualizado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listar,
  buscar,
  cadastrar,
  editar,
  alterarSenha,
  alterarStatus,
};
