'use strict';
const { getDb } = require('../config/database');

class NumeroModel {
  static get table() { return 'numeros'; }

  static async findById(id) {
    return getDb()(this.table).where({ id }).first();
  }

  static async findByCampanha(campanha_id, { status } = {}) {
    let q = getDb()(this.table).where({ campanha_id });
    if (status) q = q.where({ status });
    return q.orderBy('numero');
  }

  static async findDisponiveis(campanha_id) {
    return getDb()(this.table).where({ campanha_id, status: 'disponivel' }).orderBy('numero');
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

  static async inserirLote(campanha_id, numeros) {
    const db = getDb();
    const agora = new Date();
    const rows = numeros.map((numero) => ({ campanha_id, numero, status: 'disponivel', created_at: agora, updated_at: agora }));
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      await db(this.table).insert(rows.slice(i, i + BATCH));
    }
  }

  static async updateStatus(id, status) {
    await getDb()(this.table).where({ id }).update({ status, updated_at: new Date() });
  }

  static async deleteByCampanha(campanha_id) {
    return getDb()(this.table).where({ campanha_id }).delete();
  }
}

module.exports = NumeroModel;
