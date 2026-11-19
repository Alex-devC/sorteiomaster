'use strict';

const bcrypt = require('bcryptjs');
const UsuarioModel = require('../models/UsuarioModel');
const { AppError } = require('../utils/AppError');

const SALT_ROUNDS = 12;

async function listarUsuarios() {
  return UsuarioModel.findAll();
}

async function buscarUsuario(id) {
  const usuario = await UsuarioModel.findById(id);
  if (!usuario) throw new AppError('Usuário não encontrado.', 404);
  return usuario;
}

async function cadastrarUsuario({ nome, usuario, senha, ativo = true, permissoes = [] }) {
  const loginLimpo = usuario.trim().toLowerCase();
  const existe = await UsuarioModel.existeUsuario(loginLimpo);
  if (existe) {
    throw new AppError(`O nome de usuário '${loginLimpo}' já está em uso.`, 409);
  }

  const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
  return UsuarioModel.create({
    nome: nome.trim(),
    usuario: loginLimpo,
    senha_hash,
    ativo: !!ativo,
    permissoes: Array.isArray(permissoes) ? permissoes : [],
    is_admin_principal: false,
  });
}

async function editarUsuario(id, { nome, usuario, ativo, permissoes }, usuarioAutenticadoId) {
  const usuarioExistente = await UsuarioModel.findById(id);
  if (!usuarioExistente) throw new AppError('Usuário não encontrado.', 404);

  const loginLimpo = usuario !== undefined ? usuario.trim().toLowerCase() : usuarioExistente.usuario;

  // Validar se novo nome de usuário já pertence a outro registro
  if (loginLimpo !== usuarioExistente.usuario) {
    const existeOutro = await UsuarioModel.existeUsuario(loginLimpo, id);
    if (existeOutro) {
      throw new AppError(`O nome de usuário '${loginLimpo}' já está em uso por outro usuário.`, 409);
    }
  }

  // Regra de segurança contra desativação
  if (ativo === false || ativo === 0) {
    if (parseInt(id, 10) === parseInt(usuarioAutenticadoId, 10)) {
      throw new AppError('Você não pode desativar a sua própria conta de usuário.', 422);
    }
    if (usuarioExistente.is_admin_principal) {
      throw new AppError('A conta do administrador principal não pode ser desativada.', 422);
    }
  }

  const dadosAtualizados = {
    nome: nome !== undefined ? nome.trim() : usuarioExistente.nome,
    usuario: loginLimpo,
  };

  if (ativo !== undefined) {
    dadosAtualizados.ativo = !!ativo;
  }

  if (permissoes !== undefined) {
    dadosAtualizados.permissoes = Array.isArray(permissoes) ? permissoes : [];
  }

  return UsuarioModel.update(id, dadosAtualizados);
}

async function alterarSenha(id, novaSenha) {
  const usuario = await UsuarioModel.findById(id);
  if (!usuario) throw new AppError('Usuário não encontrado.', 404);

  if (!novaSenha || novaSenha.length < 6) {
    throw new AppError('A nova senha deve possuir pelo menos 6 caracteres.', 400);
  }

  const senha_hash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  return UsuarioModel.updateSenha(id, senha_hash);
}

async function alterarStatusUsuario(id, ativo, usuarioAutenticadoId) {
  const usuario = await UsuarioModel.findById(id);
  if (!usuario) throw new AppError('Usuário não encontrado.', 404);

  const novoAtivo = !!ativo;

  // Regras estritas ao desativar
  if (!novoAtivo) {
    if (parseInt(id, 10) === parseInt(usuarioAutenticadoId, 10)) {
      throw new AppError('Você não pode desativar a sua própria conta de usuário.', 422);
    }
    if (usuario.is_admin_principal) {
      throw new AppError('A conta do administrador principal não pode ser desativada.', 422);
    }
  }

  return UsuarioModel.update(id, { ativo: novoAtivo });
}

module.exports = {
  listarUsuarios,
  buscarUsuario,
  cadastrarUsuario,
  editarUsuario,
  alterarSenha,
  alterarStatusUsuario,
};
