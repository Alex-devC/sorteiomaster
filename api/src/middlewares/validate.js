'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware que processa o resultado dos validadores do express-validator.
 * Se houver erros, retorna 400 com lista de problemas.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Dados inválidos.');
    err.name = 'ValidationError';
    err.detalhes = errors.array().map((e) => ({ campo: e.path, mensagem: e.msg }));
    return next(err);
  }
  next();
}

module.exports = { validate };
