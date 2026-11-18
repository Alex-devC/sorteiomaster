'use strict';

/**
 * Script de teste para criar administrador via argumentos de linha de comando.
 * USO EXCLUSIVO EM AMBIENTE DE DESENVOLVIMENTO/TESTE.
 *
 * Uso:
 *   node scripts/criar-admin-test.js <usuario> <nome> <senha>
 *
 * Exemplo:
 *   node scripts/criar-admin-test.js admin "Admin Master" "minhasenha123"
 */

require('dotenv').config();

const { ensureDatabaseExists, runMigrations, closeDb } = require('../src/config/database');
const { criarUsuario } = require('../src/services/authService');

async function main() {
  const [,, usuario, nome, senha] = process.argv;

  if (!usuario || !nome || !senha) {
    console.error('Uso: node scripts/criar-admin-test.js <usuario> <nome> <senha>');
    process.exit(1);
  }

  try {
    await ensureDatabaseExists();
    await runMigrations();

    const admin = await criarUsuario({ nome, usuario, senha });
    console.log('Admin criado:', JSON.stringify(admin));
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
