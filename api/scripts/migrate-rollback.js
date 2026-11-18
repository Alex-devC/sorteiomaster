'use strict';

require('dotenv').config();

const { ensureDatabaseExists, rollbackMigration, closeDb } = require('../src/config/database');

async function main() {
  try {
    await ensureDatabaseExists();
    await rollbackMigration();
    console.log('Rollback executado.');
    process.exit(0);
  } catch (err) {
    console.error('Erro no rollback:', err.message);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
