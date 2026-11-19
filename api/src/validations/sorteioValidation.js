'use strict';

const { body, param } = require('express-validator');

const realizarSorteioValidation = [
  param('campanha_id').isInt({ min: 1 }).withMessage('campanha_id inválido.'),
  body('participante_id').isInt({ min: 1 }).withMessage('participante_id é obrigatório.'),
];

const cancelarSorteioValidation = [
  param('id').isInt({ min: 1 }).withMessage('id do sorteio inválido.'),
  body('motivo_cancelamento')
    .isString().withMessage('O motivo do cancelamento deve ser um texto válido.')
    .trim()
    .notEmpty().withMessage('O motivo do cancelamento é obrigatório.')
    .isLength({ min: 3, max: 500 }).withMessage('O motivo deve ter entre 3 e 500 caracteres.'),
];

const reativarSorteioValidation = [
  param('id').isInt({ min: 1 }).withMessage('id do sorteio inválido.'),
];

module.exports = {
  realizarSorteioValidation,
  cancelarSorteioValidation,
  reativarSorteioValidation,
};
