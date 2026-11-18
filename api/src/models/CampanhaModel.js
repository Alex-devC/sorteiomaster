'use strict';
const { getDb } = require('../config/database');

class CampanhaModel {
  static get table() { return 'campanhas'; }

  static async findById(id) {
    return getDb()(this.table).where({ id }).first();
  }

  static async findAll() {
    return getDb()(this.table).orderBy('created_at', 'desc');
  }

  static async create(data) {
    const [id] = await getDb()(this.table).insert({ ...data, created_at: new Date(), updated_at: new Date() });
    return this.findById(id);
  }

  static async update(id, data) {
    await getDb()(this.table).where({ id }).update({ ...data, updated_at: new Date() });
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getDb()(this.table).where({ id }).update({ status, updated_at: new Date() });
    return this.findById(id);
  }
}

module.exports = CampanhaModel;
