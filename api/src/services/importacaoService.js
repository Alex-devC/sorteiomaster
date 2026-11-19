'use strict';

const xlsx = require('xlsx');
const ParticipanteModel = require('../models/ParticipanteModel');
const CampanhaModel = require('../models/CampanhaModel');
const { normalizarNome } = require('../utils/helpers');
const { AppError } = require('../utils/AppError');

/**
 * Lê o buffer de um arquivo (XLSX, XLS ou CSV) e retorna as linhas como arrays ou objetos.
 */
function parseArquivoBuffer(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new AppError('O arquivo não contém planilhas válidas.', 400);
    }
    const worksheet = workbook.Sheets[firstSheetName];
    // Converte para matriz de linhas (array de arrays)
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    return rows;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Falha ao processar arquivo. Verifique se o formato é XLSX, XLS ou CSV válido.', 400);
  }
}

/**
 * Gera o preview da importação:
 * Analisa colunas, registros válidos, duplicados no arquivo, vazios e já cadastrados.
 */
async function previewImportacao(campanha_id, fileBuffer, colunaNomeParam) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);
  if (!['em_preparacao', 'ativa'].includes(campanha.status)) {
    throw new AppError('Não é possível importar participantes para esta campanha no status atual.', 422);
  }

  const rawRows = parseArquivoBuffer(fileBuffer);
  if (!rawRows || rawRows.length === 0) {
    throw new AppError('O arquivo está vazio.', 400);
  }

  // Identificar colunas (cabeçalho na linha 0)
  const headerRow = rawRows[0];
  const colunas = headerRow.map((col, idx) => ({
    indice: idx,
    nome: col !== undefined && col !== null && String(col).trim() !== '' ? String(col).trim() : `Coluna ${idx + 1}`
  }));

  // Descobrir qual coluna utilizar
  let targetColIndex = 0;
  if (colunaNomeParam !== undefined && colunaNomeParam !== null && colunaNomeParam !== '') {
    if (!isNaN(colunaNomeParam)) {
      targetColIndex = parseInt(colunaNomeParam, 10);
    } else {
      const found = colunas.find(c => c.nome.toLowerCase() === String(colunaNomeParam).trim().toLowerCase());
      if (found) targetColIndex = found.indice;
    }
  }

  // Buscar todos os participantes já cadastrados na campanha para checagem rápida
  const cadastrados = await ParticipanteModel.findByCampanha(campanha_id);
  const setCadastrados = new Set(cadastrados.map(p => p.nome_normalizado));

  const vistosNoArquivo = new Set();
  const registrosValidos = [];
  let totalEncontrados = 0;
  let totalVazios = 0;
  let totalDuplicadosArquivo = 0;
  let totalJaCadastrados = 0;

  // Percorrer a partir da linha 1 (ignorando o cabeçalho)
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    totalEncontrados++;

    const rawVal = row[targetColIndex];
    const nomeOriginal = (rawVal !== undefined && rawVal !== null) ? String(rawVal).trim() : '';

    if (!nomeOriginal) {
      totalVazios++;
      continue;
    }

    const normalizado = normalizarNome(nomeOriginal);
    if (!normalizado) {
      totalVazios++;
      continue;
    }

    if (vistosNoArquivo.has(normalizado)) {
      totalDuplicadosArquivo++;
      continue;
    }
    vistosNoArquivo.add(normalizado);

    if (setCadastrados.has(normalizado)) {
      totalJaCadastrados++;
      continue;
    }

    registrosValidos.push({
      nome: nomeOriginal,
      nome_normalizado: normalizado
    });
  }

  return {
    campanha_id,
    colunas,
    coluna_selecionada: targetColIndex,
    resumo: {
      total_encontrados: totalEncontrados,
      validos: registrosValidos.length,
      vazios: totalVazios,
      duplicados_no_arquivo: totalDuplicadosArquivo,
      ja_cadastrados_na_campanha: totalJaCadastrados
    },
    exemplos_validos: registrosValidos.slice(0, 10).map(r => r.nome),
    nomes_validos: registrosValidos.map(r => r.nome)
  };
}

/**
 * Confirma a importação efetiva de uma lista validada de nomes.
 */
async function confirmarImportacao(campanha_id, nomes) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);
  if (!['em_preparacao', 'ativa'].includes(campanha.status)) {
    throw new AppError('Não é possível importar participantes para esta campanha no status atual.', 422);
  }

  if (!Array.isArray(nomes) || nomes.length === 0) {
    throw new AppError('Lista de nomes para importação não fornecida ou vazia.', 400);
  }

  const cadastrados = await ParticipanteModel.findByCampanha(campanha_id);
  const setCadastrados = new Set(cadastrados.map(p => p.nome_normalizado));
  const inseridosNestaExecucao = new Set();
  const paraInserir = [];

  for (const n of nomes) {
    if (!n) continue;
    const nomeTrim = String(n).trim();
    const normalizado = normalizarNome(nomeTrim);
    if (!normalizado) continue;
    if (setCadastrados.has(normalizado)) continue;
    if (inseridosNestaExecucao.has(normalizado)) continue;

    inseridosNestaExecucao.add(normalizado);
    paraInserir.push({
      campanha_id,
      nome: nomeTrim,
      nome_normalizado: normalizado,
      status: 'disponivel',
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  let totalEfetivamenteImportado = 0;
  if (paraInserir.length > 0) {
    const { getDb } = require('../config/database');
    const db = getDb();
    const BATCH = 500;
    for (let i = 0; i < paraInserir.length; i += BATCH) {
      await db('participantes').insert(paraInserir.slice(i, i + BATCH));
    }
    totalEfetivamenteImportado = paraInserir.length;
  }

  return {
    campanha_id,
    total_efetivamente_importado: totalEfetivamenteImportado,
    mensagem: `${totalEfetivamenteImportado} participante(s) importado(s) com sucesso.`
  };
}

module.exports = {
  previewImportacao,
  confirmarImportacao,
  parseArquivoBuffer
};
