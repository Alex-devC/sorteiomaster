'use strict';

const { getDb } = require('../config/database');

class UsuarioModel {
  static get table() { return 'usuarios'; }

  static async findByUsuario(usuario) {
    return getDb()(this.table).where({ usuario }).first();
  }

  static async findById(id) {
    return getDb()(this.table)
      .where({ id })
      .select('id', 'nome', 'usuario', 'ativo', 'is_admin_principal', 'permissoes', 'created_at', 'updated_at')
      .first();
  }

  static async findByIdComSenha(id) {
    return getDb()(this.table).where({ id }).first();
  }

  static async findAll() {
    return getDb()(this.table)
      .select('id', 'nome', 'usuario', 'ativo', 'is_admin_principal', 'permissoes', 'created_at', 'updated_at')
      .orderBy('id', 'asc');
  }

  static async create({ nome, usuario, senha_hash, ativo = true, permissoes = '[]', is_admin_principal = false }) {
    const [id] = await getDb()(this.table).insert({
      nome,
      usuario,
      senha_hash,
      ativo: !!ativo,
      permissoes: typeof permissoes === 'string' ? permissoes : JSON.stringify(permissoes),
      is_admin_principal: !!is_admin_principal,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.findById(id);
  }

  static async update(id, data) {
    const updateData = { ...data, updated_at: new Date() };
    if (updateData.permissoes && typeof updateData.permissoes !== 'string') {
      updateData.permissoes = JSON.stringify(updateData.permissoes);
    }
    await getDb()(this.table).where({ id }).update(updateData);
    return this.findById(id);
  }

  static async updateSenha(id, senha_hash) {
    await getDb()(this.table).where({ id }).update({
      senha_hash,
      updated_at: new Date(),
    });
    return this.findById(id);
  }

  static async existeUsuario(usuario, excluirId = null) {
    let q = getDb()(this.table).where({ usuario });
    if (excluirId) {
      q = q.whereNot({ id: excluirId });
    }
    const row = await q.count('id as count').first();
    return parseInt(row.count, 10) > 0;
  }
}

module.exports = UsuarioModel;
