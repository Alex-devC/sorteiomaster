'use strict';

const { getDb } = require('../config/database');

class UsuarioModel {
  static get table() { return 'usuarios'; }

  static async findByUsuario(usuario) {
    return getDb()(this.table).where({ usuario }).first();
  }

  static async findById(id) {
    return getDb()(this.table).where({ id }).first();
  }

  static async create({ nome, usuario, senha_hash }) {
    const [id] = await getDb()(this.table).insert({
      nome,
      usuario,
      senha_hash,
      ativo: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.findById(id);
  }

  static async existeUsuario(usuario) {
    const row = await getDb()(this.table).where({ usuario }).count('id as count').first();
    return parseInt(row.count, 10) > 0;
  }
}

module.exports = UsuarioModel;
