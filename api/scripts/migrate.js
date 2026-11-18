'use strict';

require('dotenv').config();

const { ensureDatabaseExists, runMigrations, closeDb } = require('../src/config/database');

async function main() {
  try {
    await ensureDatabaseExists();
    await runMigrations();
    console.log('Migrations concluidas.');
    process.exit(0);
  } catch (err) {
    console.error('Erro nas migrations:', err.message);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
