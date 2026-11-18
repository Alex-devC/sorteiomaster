'use strict';

const { body, param } = require('express-validator');

const adicionarParticipanteValidation = [
  param('campanha_id').isInt({ min: 1 }).withMessage('campanha_id inválido.'),
  body('nome').trim().notEmpty().withMessage('nome é obrigatório.'),
];

const editarParticipanteValidation = [
  param('id').isInt({ min: 1 }).withMessage('id inválido.'),
  body('nome').trim().notEmpty().withMessage('nome é obrigatório.'),
];

const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('id inválido.'),
];

module.exports = {
  adicionarParticipanteValidation,
  editarParticipanteValidation,
  idParamValidation
};
