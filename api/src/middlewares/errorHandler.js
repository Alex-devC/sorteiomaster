'use strict';

const { AppError } = require('../utils/AppError');

/**
 * Handler centralizado de erros.
 * Captura AppError (erros de negócio) e erros inesperados.
 */
function errorHandler(err, req, res, next) {
  // Erros de negócio (AppError)
  if (err.name === 'AppError') {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erros de validação do express-validator (vindos do middleware validate)
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message, detalhes: err.detalhes });
  }

  // Erros de banco (Knex/MySQL2) — não expor detalhes internos
  if (err.code && err.code.startsWith('ER_')) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Registro duplicado.' });
    }
    console.error('[DB Error]', err.code, err.message);
    return res.status(500).json({ error: 'Erro interno no banco de dados.' });
  }

  // Erros inesperados — não expor stack ao cliente
  console.error('[Erro inesperado]', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { errorHandler };
