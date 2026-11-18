'use strict';

require('dotenv').config();

const { ensureDatabaseExists, migrationStatus, closeDb } = require('../src/config/database');

async function main() {
  try {
    await ensureDatabaseExists();
    await migrationStatus();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao verificar status:', err.message);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
