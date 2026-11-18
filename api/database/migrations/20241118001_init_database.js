'use strict';

/**
 * Migration 001 — Inicialização do Banco de Dados
 *
 * Esta migration é um marcador de que o banco sorteio_master
 * foi criado e está pronto para receber as próximas migrations.
 *
 * A criação do banco em si é feita pelo bootstrap da API (ensureDatabaseExists),
 * pois o Knex já requer um banco selecionado para executar migrations.
 *
 * Esta migration registra metadados iniciais do sistema.
 */

exports.up = async function (knex) {
  // Registrar uma tabela de metadados do sistema
  await knex.schema.createTable('system_metadata', (table) => {
    table.increments('id').primary();
    table.string('key', 100).notNullable().unique();
    table.text('value').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Inserir metadados iniciais
  await knex('system_metadata').insert([
    { key: 'db_version', value: '1' },
    { key: 'app_name', value: 'Sorteio Master' },
    { key: 'initialized_at', value: new Date().toISOString() },
  ]);

  console.log('[Migration 001] system_metadata criada e inicializada.');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('system_metadata');
  console.log('[Migration 001] system_metadata removida (rollback).');
};
