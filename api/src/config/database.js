'use strict';

require('dotenv').config();

const path = require('path');
const knex = require('knex');
const mysql2 = require('mysql2/promise');

// ─── Configuração base sem banco (para criar o banco caso não exista) ──────────
function createRootConnection() {
  return mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
}

// ─── Garantir que o banco de dados existe ─────────────────────────────────────
async function ensureDatabaseExists() {
  let conn;
  try {
    conn = await createRootConnection();
    const dbName = process.env.DB_NAME || 'sorteio_master';
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`[DB] Banco de dados '${dbName}' verificado/criado com sucesso.`);
  } catch (err) {
    throw new Error(`[DB] Falha ao garantir existência do banco: ${err.message}`);
  } finally {
    if (conn) await conn.end();
  }
}

// ─── Configuração Knex para migrations e queries ──────────────────────────────
function buildKnexConfig() {
  return {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sorteio_master',
      charset: 'utf8mb4',
    },
    migrations: {
      directory: path.join(__dirname, '../../database/migrations'),
      tableName: 'knex_migrations',
    },
    pool: {
      min: 2,
      max: 10,
    },
  };
}

let _db = null;

// ─── Inicializar conexão Knex ─────────────────────────────────────────────────
function getDb() {
  if (!_db) {
    _db = knex(buildKnexConfig());
  }
  return _db;
}

// ─── Testar conexão ───────────────────────────────────────────────────────────
async function testConnection() {
  const db = getDb();
  await db.raw('SELECT 1');
}

// ─── Executar migrations pendentes ───────────────────────────────────────────
async function runMigrations() {
  const db = getDb();
  const [batchNo, migrations] = await db.migrate.latest();
  if (migrations.length === 0) {
    console.log('[Migrations] Nenhuma migration pendente.');
  } else {
    console.log(`[Migrations] Batch ${batchNo} executado. Migrations aplicadas:`);
    migrations.forEach((m) => console.log(`  - ${m}`));
  }
}

// ─── Status das migrations ────────────────────────────────────────────────────
async function migrationStatus() {
  const db = getDb();
  const [completed, pending] = await db.migrate.list();
  console.log('\n=== Status das Migrations ===');
  console.log(`\nConcluídas (${completed.length}):`);
  if (completed.length === 0) {
    console.log('  (nenhuma)');
  } else {
    completed.forEach((m) => console.log(`  ✔ ${m.name}`));
  }
  console.log(`\nPendentes (${pending.length}):`);
  if (pending.length === 0) {
    console.log('  (nenhuma)');
  } else {
    pending.forEach((m) => console.log(`  ○ ${m.name}`));
  }
  console.log('');
}

// ─── Rollback da última migration ────────────────────────────────────────────
async function rollbackMigration() {
  const db = getDb();
  const [batchNo, migrations] = await db.migrate.rollback();
  if (migrations.length === 0) {
    console.log('[Rollback] Nenhuma migration para reverter.');
  } else {
    console.log(`[Rollback] Batch ${batchNo} revertido. Migrations desfeitas:`);
    migrations.forEach((m) => console.log(`  - ${m}`));
  }
}

// ─── Fechar conexão ───────────────────────────────────────────────────────────
async function closeDb() {
  if (_db) {
    await _db.destroy();
    _db = null;
  }
}

module.exports = {
  getDb,
  ensureDatabaseExists,
  testConnection,
  runMigrations,
  migrationStatus,
  rollbackMigration,
  closeDb,
};
