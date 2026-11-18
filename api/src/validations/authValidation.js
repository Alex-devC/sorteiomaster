'use strict';

const { body } = require('express-validator');

const loginValidation = [
  body('usuario').trim().notEmpty().withMessage('usuario é obrigatório.'),
  body('senha').notEmpty().withMessage('senha é obrigatória.'),
];

module.exports = { loginValidation };
