'use strict';

/**
 * Migration 006 — Adiciona colunas de permissões e flag de administrador principal
 */

exports.up = async function (knex) {
  const hasPermissoes = await knex.schema.hasColumn('usuarios', 'permissoes');
  const hasAdminPrincipal = await knex.schema.hasColumn('usuarios', 'is_admin_principal');

  await knex.schema.alterTable('usuarios', (table) => {
    if (!hasPermissoes) {
      table.text('permissoes').nullable().defaultTo('[]');
    }
    if (!hasAdminPrincipal) {
      table.boolean('is_admin_principal').notNullable().defaultTo(false);
    }
  });

  // Atualiza o usuário administrador raiz (admin) caso já exista
  await knex('usuarios')
    .where({ usuario: 'admin' })
    .update({
      is_admin_principal: true,
      permissoes: JSON.stringify(['*']),
      updated_at: new Date()
    });

  console.log('[Migration 006] Colunas permissoes e is_admin_principal adicionadas a usuarios.');
};

exports.down = async function (knex) {
  await knex.schema.alterTable('usuarios', (table) => {
    table.dropColumn('permissoes');
    table.dropColumn('is_admin_principal');
  });

  console.log('[Migration 006] Colunas permissoes e is_admin_principal removidas (rollback).');
};
