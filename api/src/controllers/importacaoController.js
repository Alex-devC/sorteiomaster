'use strict';

const { previewImportacao, confirmarImportacao } = require('../services/importacaoService');
const { AppError } = require('../utils/AppError');

async function preview(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    if (!req.file || !req.file.buffer) {
      throw new AppError('Nenhum arquivo enviado.', 400);
    }
    const { coluna } = req.body;
    const resultado = await previewImportacao(campanha_id, req.file.buffer, coluna);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function confirmar(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const { nomes } = req.body;
    const resultado = await confirmarImportacao(campanha_id, nomes);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  preview,
  confirmar
};
