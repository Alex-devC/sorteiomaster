'use strict';

const { gerarExcelSorteios, gerarCsvSorteios } = require('../services/exportacaoService');

async function exportarExcel(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const { buffer, filename } = await gerarExcelSorteios(campanha_id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}

async function exportarCsv(req, res, next) {
  try {
    const campanha_id = parseInt(req.params.campanha_id, 10);
    const { content, filename } = await gerarCsvSorteios(campanha_id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(content);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  exportarExcel,
  exportarCsv
};
