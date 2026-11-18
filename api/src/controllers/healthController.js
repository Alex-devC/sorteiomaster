'use strict';

/**
 * Controller do endpoint de health check.
 * Retorna: status da API, conexão MySQL e ambiente.
 */

const { testConnection } = require('../config/database');

async function health(req, res) {
  const env = process.env.NODE_ENV || 'development';
  let dbStatus = 'ok';
  let dbError = null;

  try {
    await testConnection();
  } catch (err) {
    dbStatus = 'error';
    dbError = 'Conexão com o MySQL indisponível';
  }

  const statusCode = dbStatus === 'ok' ? 200 : 503;

  return res.status(statusCode).json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    api: 'Sorteio Master API',
    version: '1.0.0',
    environment: env,
    database: {
      status: dbStatus,
      ...(dbError && { error: dbError }),
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = { health };
