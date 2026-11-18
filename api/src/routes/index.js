'use strict';

const express = require('express');
const router = express.Router();
const { health } = require('../controllers/healthController');

// Health check público
router.get('/health', health);

// Autenticação (Login)
router.use('/auth', require('./auth'));

// Rotas administrativas protegidas por JWT
router.use('/admin', require('./admin'));

module.exports = router;
