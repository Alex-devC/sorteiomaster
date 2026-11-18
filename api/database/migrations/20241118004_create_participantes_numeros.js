'use strict';

/**
 * Migration 004 — Tabelas de participantes e numeros
 */

exports.up = async function (knex) {
  // ─── participantes ────────────────────────────────────────────────────────
  await knex.schema.createTable('participantes', (table) => {
    table.increments('id').primary();
    table
      .integer('campanha_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('campanhas')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.string('nome', 200).notNullable();
    table.string('nome_normalizado', 200).notNullable();
    table
      .enu('status', ['disponivel', 'sorteado', 'inativo'])
      .notNullable()
      .defaultTo('disponivel');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Garantir unicidade de nome (normalizado) dentro da campanha
    table.unique(['campanha_id', 'nome_normalizado']);
    table.index(['campanha_id', 'status']);
  });

  // ─── numeros ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('numeros', (table) => {
    table.increments('id').primary();
    table
      .integer('campanha_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('campanhas')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.integer('numero').unsigned().notNullable();
    table
      .enu('status', ['disponivel', 'sorteado'])
      .notNullable()
      .defaultTo('disponivel');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Sem números duplicados dentro da mesma campanha
    table.unique(['campanha_id', 'numero']);
    table.index(['campanha_id', 'status']);
  });

  console.log('[Migration 004] Tabelas participantes e numeros criadas.');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('numeros');
  await knex.schema.dropTableIfExists('participantes');
  console.log('[Migration 004] Tabelas participantes e numeros removidas (rollback).');
};
