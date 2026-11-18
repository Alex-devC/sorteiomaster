'use strict';
require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function checkAdmin() {
  let conn;
  try {
    conn = await mysql2.createConnection({
      host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const [rows] = await conn.query('SELECT id, nome, usuario, senha_hash, ativo FROM usuarios');
    rows.forEach(r => {
      const isHash = r.senha_hash && r.senha_hash.startsWith('$2');
      console.log(`ID: ${r.id} | Usuario: ${r.usuario} | Nome: ${r.nome} | Ativo: ${r.ativo}`);
      console.log(`  senha_hash (${isHash ? 'BCRYPT OK' : 'ALERTA: NAO HASH'}): ${r.senha_hash.substring(0, 30)}...`);
    });
  } finally {
    if (conn) await conn.end();
  }
}

checkAdmin().catch(e => { console.error(e.message); process.exit(1); });
