'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  // ─── Segurança: Helmet (cabeçalhos HTTP) ─────────────────────────────────
  app.use(helmet());

  // ─── Rate Limit global ───────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em instantes.' },
  });
  app.use(globalLimiter);

  // ─── Rate Limit para login (proteção brute-force) ────────────────────────
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  });
  app.use('/api/auth/login', loginLimiter);

  // ─── Parsers ──────────────────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── Rotas ────────────────────────────────────────────────────────────────
  const routes = require('./routes/index');
  app.use('/api', routes);

  // ─── Rota 404 ─────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
  });

  // ─── Handler de erros centralizado ───────────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
