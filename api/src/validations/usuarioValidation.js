'use strict';

const { body, param } = require('express-validator');

const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de usuário inválido.'),
];

const cadastrarUsuarioValidation = [
  body('nome')
    .isString().withMessage('Nome deve ser uma string.')
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('Nome deve possuir entre 3 e 150 caracteres.'),
  body('usuario')
    .isString().withMessage('Nome de usuário deve ser uma string.')
    .trim()
    .isLength({ min: 3, max: 80 }).withMessage('Nome de usuário deve possuir entre 3 e 80 caracteres.')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Nome de usuário deve conter apenas letras, números, ponto, hífen ou sublinhado.'),
  body('senha')
    .isString().withMessage('Senha deve ser uma string.')
    .isLength({ min: 6, max: 100 }).withMessage('Senha deve possuir no mínimo 6 caracteres.'),
  body('ativo')
    .optional()
    .isBoolean().withMessage('ativo deve ser booleano.'),
  body('permissoes')
    .optional()
    .isArray().withMessage('permissoes deve ser uma lista (array).'),
];

const editarUsuarioValidation = [
  ...idParamValidation,
  body('nome')
    .optional()
    .isString().withMessage('Nome deve ser uma string.')
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage('Nome deve possuir entre 3 e 150 caracteres.'),
  body('usuario')
    .optional()
    .isString().withMessage('Nome de usuário deve ser uma string.')
    .trim()
    .isLength({ min: 3, max: 80 }).withMessage('Nome de usuário deve possuir entre 3 e 80 caracteres.')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Nome de usuário deve conter apenas letras, números, ponto, hífen ou sublinhado.'),
  body('ativo')
    .optional()
    .isBoolean().withMessage('ativo deve ser booleano.'),
  body('permissoes')
    .optional()
    .isArray().withMessage('permissoes deve ser uma lista (array).'),
];

const alterarSenhaValidation = [
  ...idParamValidation,
  body('nova_senha')
    .isString().withMessage('nova_senha deve ser uma string.')
    .isLength({ min: 6, max: 100 }).withMessage('A nova senha deve possuir no mínimo 6 caracteres.'),
];

const alterarStatusValidation = [
  ...idParamValidation,
  body('ativo')
    .isBoolean().withMessage('ativo deve ser booleano (true ou false).'),
];

module.exports = {
  idParamValidation,
  cadastrarUsuarioValidation,
  editarUsuarioValidation,
  alterarSenhaValidation,
  alterarStatusValidation,
};
