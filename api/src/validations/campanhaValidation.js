'use strict';

const { body, param } = require('express-validator');

const criarCampanhaValidation = [
  body('nome').trim().notEmpty().withMessage('nome é obrigatório.'),
  body('numero_inicial')
    .isInt({ min: 0 })
    .withMessage('numero_inicial deve ser um inteiro não negativo.'),
  body('numero_final')
    .isInt({ min: 0 })
    .withMessage('numero_final deve ser um inteiro não negativo.')
    .custom((val, { req }) => {
      if (parseInt(val, 10) < parseInt(req.body.numero_inicial, 10)) {
        throw new Error('numero_final deve ser maior ou igual a numero_inicial.');
      }
      return true;
    }),
  body('todos_premiados')
    .optional()
    .isBoolean()
    .withMessage('todos_premiados deve ser boolean.'),
];

const editarCampanhaValidation = [
  param('id').isInt({ min: 1 }).withMessage('id inválido.'),
  body('nome').optional().trim().notEmpty().withMessage('nome não pode ser vazio.'),
  body('numero_inicial').optional().isInt({ min: 0 }).withMessage('numero_inicial deve ser inteiro não negativo.'),
  body('numero_final').optional().isInt({ min: 0 }).withMessage('numero_final deve ser inteiro não negativo.'),
  body('todos_premiados').optional().isBoolean().withMessage('todos_premiados deve ser boolean.'),
];

const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('id deve ser um inteiro positivo.'),
];

const statusValidation = [
  body('status')
    .isIn(['em_preparacao', 'ativa', 'finalizada', 'cancelada'])
    .withMessage('status inválido.'),
];

module.exports = {
  criarCampanhaValidation,
  editarCampanhaValidation,
  idParamValidation,
  statusValidation
};
