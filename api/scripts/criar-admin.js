'use strict';

/**
 * Script interativo para criar o primeiro administrador.
 * Recebe usuário, nome e senha por entrada no terminal (sem registrar em logs).
 *
 * Uso:
 *   node scripts/criar-admin.js
 */

require('dotenv').config();

const readline = require('readline');
const { ensureDatabaseExists, runMigrations, closeDb } = require('../src/config/database');
const { criarUsuario } = require('../src/services/authService');

function perguntar(rl, pergunta, ocultar = false) {
  return new Promise((resolve) => {
    if (ocultar && process.stdin.isTTY) {
      // Ocultar entrada da senha no terminal
      process.stdout.write(pergunta);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      let resposta = '';
      const handler = (char) => {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          resolve(resposta);
        } else if (char === '\u0003') {
          // Ctrl+C
          process.stdout.write('\n');
          process.exit(0);
        } else if (char === '\u007F') {
          // Backspace
          if (resposta.length > 0) {
            resposta = resposta.slice(0, -1);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(pergunta + '*'.repeat(resposta.length));
          }
        } else {
          resposta += char;
          process.stdout.write('*');
        }
      };
      process.stdin.on('data', handler);
    } else {
      rl.question(pergunta, (resposta) => resolve(resposta.trim()));
    }
  });
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   SORTEIO MASTER — Criar Administrador   ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Garantir banco e migrations antes de qualquer operação
    await ensureDatabaseExists();
    await runMigrations();

    const nome = await perguntar(rl, 'Nome completo: ');
    if (!nome) throw new Error('Nome é obrigatório.');

    const usuario = await perguntar(rl, 'Nome de usuário (login): ');
    if (!usuario) throw new Error('Nome de usuário é obrigatório.');

    const senha = await perguntar(rl, 'Senha: ', true);
    if (!senha || senha.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');

    const confirmacao = await perguntar(rl, 'Confirmar senha: ', true);
    if (senha !== confirmacao) throw new Error('As senhas não coincidem.');

    const admin = await criarUsuario({ nome, usuario, senha });

    console.log('\n✔ Administrador criado com sucesso!');
    console.log(`  ID     : ${admin.id}`);
    console.log(`  Nome   : ${admin.nome}`);
    console.log(`  Usuário: ${admin.usuario}`);
    console.log('\nGuarde essas informações com segurança.\n');

    process.exit(0);
  } catch (err) {
    console.error(`\n✗ Erro: ${err.message}\n`);
    process.exit(1);
  } finally {
    rl.close();
    await closeDb();
  }
}

main();
