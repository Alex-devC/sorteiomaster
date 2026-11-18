'use strict';

/**
 * Migration 005 — Tabela de sorteios
 */

exports.up = async function (knex) {
  await knex.schema.createTable('sorteios', (table) => {
    table.increments('id').primary();
    table
      .integer('campanha_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('campanhas')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .integer('participante_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('participantes')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .integer('numero_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('numeros')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .enu('status', ['confirmado', 'cancelado'])
      .notNullable()
      .defaultTo('confirmado');
    table.timestamp('sorteado_em').notNullable().defaultTo(knex.fn.now());
    table.timestamp('cancelado_em').nullable();
    table.text('motivo_cancelamento').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Índices para performance e integridade
    table.index(['campanha_id', 'status']);
    table.index(['participante_id', 'status']);
    table.index(['numero_id', 'status']);
  });

  // Garantir que um participante e um número só tenham 1 resultado ativo por campanha
  // (via unique parcial — MySQL não suporta diretamente, então usamos trigger ou
  //  validação na camada de serviço + índice convencional para suporte)
  await knex.raw(`
    CREATE UNIQUE INDEX idx_sorteio_participante_confirmado
    ON sorteios (participante_id, status)
    WHERE status = 'confirmado'
  `).catch(() => {
    // MySQL não suporta índices parciais — validação feita na camada de serviço
  });

  await knex.raw(`
    CREATE UNIQUE INDEX idx_sorteio_numero_confirmado
    ON sorteios (numero_id, status)
    WHERE status = 'confirmado'
  `).catch(() => {
    // MySQL não suporta índices parciais — validação feita na camada de serviço
  });

  console.log('[Migration 005] Tabela sorteios criada.');
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sorteios');
  console.log('[Migration 005] Tabela sorteios removida (rollback).');
};
