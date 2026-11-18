'use strict';
require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function test() {
  let conn;
  try {
    conn = await mysql2.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    const [rows] = await conn.query("SHOW DATABASES LIKE 'sorteio_master'");
    console.log('Banco sorteio_master existe:', rows.length > 0 ? 'SIM' : 'NAO');
    const [tables] = await conn.query('SHOW TABLES IN sorteio_master');
    console.log('Tabelas no banco:');
    tables.forEach(t => console.log(' -', Object.values(t)[0]));
  } finally {
    if (conn) await conn.end();
  }
}

test().catch(e => { console.error(e.message); process.exit(1); });
