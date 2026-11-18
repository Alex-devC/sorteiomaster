'use strict';

const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/autenticar');
const { validate } = require('../middlewares/validate');
const { cancelarSorteioValidation } = require('../validations/sorteioValidation');
const { cancelar } = require('../controllers/sorteioController');

// Cancelamento de sorteio (rota separada pelo param :id global)
router.use(autenticar);
router.patch('/sorteios/:id/cancelar', cancelarSorteioValidation, validate, cancelar);

module.exports = router;
