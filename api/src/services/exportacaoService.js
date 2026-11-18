'use strict';

const ExcelJS = require('exceljs');
const CampanhaModel = require('../models/CampanhaModel');
const { listarSorteios } = require('./sorteioService');
const { AppError } = require('../utils/AppError');

async function gerarExcelSorteios(campanha_id) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);

  const sorteios = await listarSorteios(campanha_id);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sorteio Master';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Resultados');
  worksheet.columns = [
    { header: 'ID Sorteio', key: 'id', width: 12 },
    { header: 'Participante', key: 'participante_nome', width: 35 },
    { header: 'Número Sorteado', key: 'numero_sorteado', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Data/Hora Sorteio', key: 'sorteado_em', width: 22 },
    { header: 'Data/Hora Cancelamento', key: 'cancelado_em', width: 22 },
    { header: 'Motivo Cancelamento', key: 'motivo_cancelamento', width: 35 },
  ];

  sorteios.forEach((s) => {
    worksheet.addRow({
      id: s.id,
      participante_nome: s.participante_nome,
      numero_sorteado: s.numero_sorteado,
      status: s.status,
      sorteado_em: s.sorteado_em ? new Date(s.sorteado_em).toLocaleString('pt-BR') : '',
      cancelado_em: s.cancelado_em ? new Date(s.cancelado_em).toLocaleString('pt-BR') : '',
      motivo_cancelamento: s.motivo_cancelamento || '',
    });
  });

  // Estilização simples do cabeçalho
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    buffer,
    filename: `sorteios_campanha_${campanha_id}.xlsx`,
  };
}

async function gerarCsvSorteios(campanha_id) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);

  const sorteios = await listarSorteios(campanha_id);

  const header = ['ID Sorteio', 'Participante', 'Número Sorteado', 'Status', 'Data Sorteio', 'Data Cancelamento', 'Motivo Cancelamento'];
  const linhas = [header.join(';')];

  sorteios.forEach((s) => {
    const dSorteio = s.sorteado_em ? new Date(s.sorteado_em).toISOString() : '';
    const dCancel = s.cancelado_em ? new Date(s.cancelado_em).toISOString() : '';
    const motivo = (s.motivo_cancelamento || '').replace(/;/g, ',');
    const nome = (s.participante_nome || '').replace(/;/g, ',');

    linhas.push([
      s.id,
      `"${nome}"`,
      s.numero_sorteado,
      s.status,
      dSorteio,
      dCancel,
      `"${motivo}"`
    ].join(';'));
  });

  const csvContent = '\uFEFF' + linhas.join('\r\n');
  return {
    content: csvContent,
    filename: `sorteios_campanha_${campanha_id}.csv`,
  };
}

module.exports = {
  gerarExcelSorteios,
  gerarCsvSorteios
};
