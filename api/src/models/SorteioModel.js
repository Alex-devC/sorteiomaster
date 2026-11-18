'use strict';
const { getDb } = require('../config/database');

class SorteioModel {
  static get table() { return 'sorteios'; }

  static async findById(id) {
    return getDb()('sorteios as s')
      .join('participantes as p', 's.participante_id', 'p.id')
      .join('numeros as n', 's.numero_id', 'n.id')
      .where('s.id', id)
      .select('s.*', 'p.nome as participante_nome', 'n.numero as numero_sorteado')
      .first();
  }

  static async findByCampanha(campanha_id, { status, participante_id, numero } = {}) {
    let q = getDb()('sorteios as s')
      .join('participantes as p', 's.participante_id', 'p.id')
      .join('numeros as n', 's.numero_id', 'n.id')
      .where('s.campanha_id', campanha_id)
      .select('s.*', 'p.nome as participante_nome', 'n.numero as numero_sorteado');
    if (status) q = q.where('s.status', status);
    if (participante_id) q = q.where('s.participante_id', participante_id);
    if (numero !== undefined && numero !== null) q = q.where('n.numero', numero);
    return q.orderBy('s.sorteado_em', 'desc');
  }

  static async findConfirmadoByParticipante(participante_id) {
    return getDb()(this.table).where({ participante_id, status: 'confirmado' }).first();
  }

  static async findConfirmadoByNumero(numero_id) {
    return getDb()(this.table).where({ numero_id, status: 'confirmado' }).first();
  }

  static async create({ campanha_id, participante_id, numero_id }) {
    const [id] = await getDb()(this.table).insert({
      campanha_id, participante_id, numero_id, status: 'confirmado',
      sorteado_em: new Date(), created_at: new Date(), updated_at: new Date(),
    });
    return this.findById(id);
  }

  static async cancelar(id, motivo_cancelamento) {
    await getDb()(this.table).where({ id }).update({
      status: 'cancelado', cancelado_em: new Date(),
      motivo_cancelamento: motivo_cancelamento || null, updated_at: new Date(),
    });
    return this.findById(id);
  }
}

module.exports = SorteioModel;
