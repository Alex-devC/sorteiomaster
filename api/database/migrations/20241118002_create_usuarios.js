'use strict';

/**
 * Migration 002 — Tabela de usuários administrativos
 */

exports.up = async function (knex) {
  await knex.schema.createTable('usuarios', (table) => {
    table.increments('id').primary();
    table.string('nome', 150).notNullable();
    table.string('usuario', 80).notNullable().unique();
    table.string('senha_hash', 255).notNullable();
    table.boolean('ativo').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  console.log('[Migration 002] Tabela usuarios criada.');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('usuarios');
  console.log('[Migration 002] Tabela usuarios removida (rollback).');
};
