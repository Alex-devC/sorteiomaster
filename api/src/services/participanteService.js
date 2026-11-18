'use strict';

const ParticipanteModel = require('../models/ParticipanteModel');
const CampanhaModel = require('../models/CampanhaModel');
const { normalizarNome } = require('../utils/helpers');
const { AppError } = require('../utils/AppError');

async function adicionarParticipante(campanha_id, nome) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);
  if (!['em_preparacao', 'ativa'].includes(campanha.status)) {
    throw new AppError('Não é possível adicionar participantes a esta campanha.', 422);
  }

  const nome_normalizado = normalizarNome(nome);
  if (!nome_normalizado) throw new AppError('Nome do participante é obrigatório.', 400);

  const existe = await ParticipanteModel.existeNomeCampanha(campanha_id, nome_normalizado);
  if (existe) {
    throw new AppError(`Participante '${nome.trim()}' já cadastrado nesta campanha.`, 409);
  }

  return ParticipanteModel.create({ campanha_id, nome: nome.trim(), nome_normalizado });
}

async function editarParticipante(id, nome) {
  const participante = await ParticipanteModel.findById(id);
  if (!participante) throw new AppError('Participante não encontrado.', 404);
  if (participante.status === 'sorteado') {
    throw new AppError('Participante sorteado não pode ser editado.', 422);
  }

  const nome_normalizado = normalizarNome(nome);
  if (!nome_normalizado) throw new AppError('Nome é obrigatório.', 400);

  const existe = await ParticipanteModel.existeNomeCampanha(participante.campanha_id, nome_normalizado, id);
  if (existe) {
    throw new AppError(`Nome '${nome.trim()}' já está em uso nesta campanha.`, 409);
  }

  return ParticipanteModel.update(id, { nome: nome.trim(), nome_normalizado });
}

async function excluirParticipante(id) {
  const participante = await ParticipanteModel.findById(id);
  if (!participante) throw new AppError('Participante não encontrado.', 404);
  if (participante.status === 'sorteado') {
    throw new AppError('Participante sorteado não pode ser excluído.', 422);
  }

  await ParticipanteModel.delete(id);
  return { mensagem: 'Participante excluído com sucesso.' };
}

async function listarParticipantes(campanha_id, { status, busca } = {}) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);
  return ParticipanteModel.findByCampanha(campanha_id, { status, busca });
}

async function buscarParticipante(id) {
  const p = await ParticipanteModel.findById(id);
  if (!p) throw new AppError('Participante não encontrado.', 404);
  return p;
}

async function listarDisponiveis(campanha_id) {
  const campanha = await CampanhaModel.findById(campanha_id);
  if (!campanha) throw new AppError('Campanha não encontrada.', 404);
  return ParticipanteModel.findDisponiveis(campanha_id);
}

module.exports = {
  adicionarParticipante,
  editarParticipante,
  excluirParticipante,
  listarParticipantes,
  buscarParticipante,
  listarDisponiveis
};
