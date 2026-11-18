'use strict';
require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function checkTables() {
  let conn;
  try {
    conn = await mysql2.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const tabelas = ['usuarios', 'campanhas', 'participantes', 'numeros', 'sorteios'];
    for (const tabela of tabelas) {
      const [cols] = await conn.query(`DESCRIBE ${tabela}`);
      console.log(`\n=== ${tabela} ===`);
      cols.forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${c.Key ? '[' + c.Key + ']' : ''}`));
    }

    // Verificar FKs
    console.log('\n=== Chaves Estrangeiras ===');
    const [fks] = await conn.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [process.env.DB_NAME]);
    fks.forEach(fk => console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`));

  } finally {
    if (conn) await conn.end();
  }
}

checkTables().catch(e => { console.error(e.message); process.exit(1); });
