'use strict';
const { getDb } = require('../config/database');

class ParticipanteModel {
  static get table() { return 'participantes'; }

  static async findById(id) {
    return getDb()(this.table).where({ id }).first();
  }

  static async findByCampanha(campanha_id, { status, busca } = {}) {
    let q = getDb()(this.table).where({ campanha_id });
    if (status) q = q.where({ status });
    if (busca) q = q.whereRaw('nome_normalizado LIKE ?', [`%${busca.toLowerCase().trim()}%`]);
    return q.orderBy('nome');
  }

  static async findDisponiveis(campanha_id) {
    return getDb()(this.table).where({ campanha_id, status: 'disponivel' }).orderBy('nome');
  }

  static async countDisponiveis(campanha_id) {
    const row = await getDb()(this.table).where({ campanha_id, status: 'disponivel' }).count('id as count').first();
    return parseInt(row.count, 10);
  }

  static async countSorteados(campanha_id) {
    const row = await getDb()(this.table).where({ campanha_id, status: 'sorteado' }).count('id as count').first();
    return parseInt(row.count, 10);
  }

  static async countTotal(campanha_id) {
    const row = await getDb()(this.table).where({ campanha_id }).count('id as count').first();
    return parseInt(row.count, 10);
  }

  static async create({ campanha_id, nome, nome_normalizado }) {
    const [id] = await getDb()(this.table).insert({
      campanha_id, nome, nome_normalizado, status: 'disponivel',
      created_at: new Date(), updated_at: new Date(),
    });
    return this.findById(id);
  }

  static async update(id, { nome, nome_normalizado }) {
    await getDb()(this.table).where({ id }).update({ nome, nome_normalizado, updated_at: new Date() });
    return this.findById(id);
  }

  static async delete(id) {
    return getDb()(this.table).where({ id }).delete();
  }

  static async updateStatus(id, status) {
    await getDb()(this.table).where({ id }).update({ status, updated_at: new Date() });
  }

  static async existeNomeCampanha(campanha_id, nome_normalizado, excludeId = null) {
    let q = getDb()(this.table).where({ campanha_id, nome_normalizado }).count('id as count');
    if (excludeId) q = q.whereNot({ id: excludeId });
    const row = await q.first();
    return parseInt(row.count, 10) > 0;
  }
}

module.exports = ParticipanteModel;
