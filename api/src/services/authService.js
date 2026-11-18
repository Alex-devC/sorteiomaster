'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
const { AppError } = require('../utils/AppError');

const SALT_ROUNDS = 12;

async function hashSenha(senha) {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

async function verificarSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

function gerarToken(usuario) {
  const payload = {
    sub: usuario.id,
    usuario: usuario.usuario,
    nome: usuario.nome,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

async function login(usuario, senha) {
  const user = await UsuarioModel.findByUsuario(usuario);
  if (!user) throw new AppError('Credenciais inválidas.', 401);
  if (!user.ativo) throw new AppError('Usuário inativo.', 403);

  const senhaValida = await verificarSenha(senha, user.senha_hash);
  if (!senhaValida) throw new AppError('Credenciais inválidas.', 401);

  const token = gerarToken(user);
  return {
    token,
    usuario: { id: user.id, nome: user.nome, usuario: user.usuario },
  };
}

async function criarUsuario({ nome, usuario, senha }) {
  const existe = await UsuarioModel.existeUsuario(usuario);
  if (existe) throw new AppError(`Usuário '${usuario}' já existe.`, 409);

  const senha_hash = await hashSenha(senha);
  const novoUsuario = await UsuarioModel.create({ nome, usuario, senha_hash });
  return { id: novoUsuario.id, nome: novoUsuario.nome, usuario: novoUsuario.usuario };
}

module.exports = { login, criarUsuario, hashSenha, gerarToken };
