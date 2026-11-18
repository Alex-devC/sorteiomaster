'use strict';

require('dotenv').config();

const { createApp } = require('./app');
const {
  ensureDatabaseExists,
  runMigrations,
  testConnection,
} = require('./config/database');

const PORT = parseInt(process.env.PORT || '3001', 10);

async function bootstrap() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║       SORTEIO MASTER — API           ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`[Boot] Ambiente: ${process.env.NODE_ENV || 'development'}`);

  // 1. Garantir que o banco de dados existe (conexão sem DB específico)
  console.log('[Boot] Verificando banco de dados...');
  try {
    await ensureDatabaseExists();
  } catch (err) {
    console.error(`[Boot] ERRO CRÍTICO: ${err.message}`);
    console.error('[Boot] Verifique as configurações em .env e se o MySQL está em execução.');
    process.exit(1);
  }

  // 2. Executar migrations pendentes
  console.log('[Boot] Executando migrations...');
  try {
    await runMigrations();
  } catch (err) {
    console.error(`[Boot] ERRO CRÍTICO nas migrations: ${err.message}`);
    console.error('[Boot] A API não pode iniciar com migrations com falha.');
    process.exit(1);
  }

  // 3. Testar conexão final
  console.log('[Boot] Testando conexão com o banco...');
  try {
    await testConnection();
    console.log('[Boot] Conexão com MySQL: OK');
  } catch (err) {
    console.error(`[Boot] ERRO CRÍTICO: Conexão com MySQL falhou: ${err.message}`);
    process.exit(1);
  }

  // 4. Subir servidor Express
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[Boot] API iniciada com sucesso em http://localhost:${PORT}`);
    console.log(`[Boot] Health check: http://localhost:${PORT}/api/health`);
  });
}

bootstrap();
