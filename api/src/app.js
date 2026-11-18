'use strict';

const express = require('express');

function createApp() {
  const app = express();

  // ─── Middlewares globais ──────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── Cabeçalhos básicos de segurança ─────────────────────────────────────
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // ─── Rotas ────────────────────────────────────────────────────────────────
  const routes = require('./routes/index');
  app.use('/api', routes);

  // ─── Rota 404 ─────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
  });

  // ─── Handler de erros global ──────────────────────────────────────────────
  app.use((err, req, res, next) => {
    console.error('[Erro interno]', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  });

  return app;
}

module.exports = { createApp };
