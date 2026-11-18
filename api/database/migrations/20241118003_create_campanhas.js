'use strict';

/**
 * Migration 003 — Tabela de campanhas
 */

exports.up = async function (knex) {
  await knex.schema.createTable('campanhas', (table) => {
    table.increments('id').primary();
    table.string('nome', 200).notNullable();
    table.integer('numero_inicial').unsigned().notNullable();
    table.integer('numero_final').unsigned().notNullable();
    table.boolean('todos_premiados').notNullable().defaultTo(false);
    table
      .enu('status', ['em_preparacao', 'ativa', 'finalizada', 'cancelada'])
      .notNullable()
      .defaultTo('em_preparacao');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Índices
    table.index('status');
  });

  console.log('[Migration 003] Tabela campanhas criada.');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('campanhas');
  console.log('[Migration 003] Tabela campanhas removida (rollback).');
};
