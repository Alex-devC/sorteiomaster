'use strict';

const { login } = require('../services/authService');

async function loginController(req, res, next) {
  try {
    const { usuario, senha } = req.body;
    const resultado = await login(usuario, senha);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { loginController };
