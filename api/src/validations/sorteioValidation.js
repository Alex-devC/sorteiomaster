'use strict';

const { body, param } = require('express-validator');

const realizarSorteioValidation = [
  param('campanha_id').isInt({ min: 1 }).withMessage('campanha_id inválido.'),
  body('participante_id').isInt({ min: 1 }).withMessage('participante_id é obrigatório.'),
];

const cancelarSorteioValidation = [
  param('id').isInt({ min: 1 }).withMessage('id do sorteio inválido.'),
  body('motivo_cancelamento').optional().isString(),
];

module.exports = {
  realizarSorteioValidation,
  cancelarSorteioValidation
};
