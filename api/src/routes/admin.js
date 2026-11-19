'use strict';

const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/autenticar');
const { validate } = require('../middlewares/validate');
const { upload } = require('../middlewares/upload');

// Validações
const {
  criarCampanhaValidation,
  editarCampanhaValidation,
  idParamValidation,
  statusValidation
} = require('../validations/campanhaValidation');

const {
  adicionarParticipanteValidation,
  editarParticipanteValidation,
  idParamValidation: idPartValidation
} = require('../validations/participanteValidation');

const {
  realizarSorteioValidation,
  cancelarSorteioValidation,
  reativarSorteioValidation
} = require('../validations/sorteioValidation');

const {
  cadastrarUsuarioValidation,
  editarUsuarioValidation,
  alterarSenhaValidation,
  alterarStatusValidation: alterarStatusUsuarioValidation,
  idParamValidation: idUsuarioParam,
} = require('../validations/usuarioValidation');

// Controllers
const {
  criar,
  editar,
  listar,
  buscar,
  alterarStatus,
  conferir,
  excluir: excluirCampanha,
  reativar: reativarCampanha
} = require('../controllers/campanhaController');

const usuarioController = require('../controllers/usuarioController');

const {
  adicionar: adicionarP,
  editar: editarP,
  excluir: excluirP,
  listar: listarP,
  buscar: buscarP,
  listarDisponivelController
} = require('../controllers/participanteController');

const {
  listar: listarN,
  buscar: buscarN,
  estatisticas: estatN
} = require('../controllers/numeroController');

const {
  realizar,
  cancelar,
  reativar,
  listar: listarS,
  buscar: buscarS
} = require('../controllers/sorteioController');

const importacaoController = require('../controllers/importacaoController');
const exportacaoController = require('../controllers/exportacaoController');

// Todas as rotas administrativas exigem autenticação
router.use(autenticar);

// ─── Campanhas ────────────────────────────────────────────────────────────────
router.post('/campanhas', criarCampanhaValidation, validate, criar);
router.get('/campanhas', listar);
router.get('/campanhas/:id', idParamValidation, validate, buscar);
router.put('/campanhas/:id', editarCampanhaValidation, validate, editar);
router.patch('/campanhas/:id/status', [...idParamValidation, ...statusValidation], validate, alterarStatus);
router.get('/campanhas/:id/conferencia', idParamValidation, validate, conferir);

// ─── Participantes ────────────────────────────────────────────────────────────
router.post('/campanhas/:campanha_id/participantes', adicionarParticipanteValidation, validate, adicionarP);
router.get('/campanhas/:campanha_id/participantes', listarP);
router.get('/campanhas/:campanha_id/participantes/disponiveis', listarDisponivelController);
router.get('/participantes/:id', idPartValidation, validate, buscarP);
router.put('/participantes/:id', editarParticipanteValidation, validate, editarP);
router.delete('/participantes/:id', idPartValidation, validate, excluirP);

// ─── Importação de Participantes ──────────────────────────────────────────────
router.post('/campanhas/:campanha_id/importar/preview', upload.single('arquivo'), importacaoController.preview);
router.post('/campanhas/:campanha_id/importar/confirmar', importacaoController.confirmar);

// ─── Números ──────────────────────────────────────────────────────────────────
router.get('/campanhas/:campanha_id/numeros', listarN);
router.get('/campanhas/:campanha_id/numeros/stats', estatN);
router.get('/numeros/:id', buscarN);

// ─── Sorteios ─────────────────────────────────────────────────────────────────
router.post('/campanhas/:campanha_id/sorteios', realizarSorteioValidation, validate, realizar);
router.get('/campanhas/:campanha_id/sorteios', listarS);
router.get('/sorteios/:id', buscarS);
router.patch('/sorteios/:id/cancelar', cancelarSorteioValidation, validate, cancelar);
router.patch('/sorteios/:id/reativar', reativarSorteioValidation, validate, reativar);

// ─── Exportação de Resultados ─────────────────────────────────────────────────
router.get('/campanhas/:campanha_id/exportar/excel', exportacaoController.exportarExcel);
router.get('/campanhas/:campanha_id/exportar/csv', exportacaoController.exportarCsv);

// ─── Exclusão e Reativação de Campanhas ───────────────────────────────────────
router.delete('/campanhas/:id', idParamValidation, validate, excluirCampanha);
router.delete('/campanhas/:id/excluir', idParamValidation, validate, excluirCampanha);
router.post('/campanhas/:id/reativar', idParamValidation, validate, reativarCampanha);

// ─── Usuários ─────────────────────────────────────────────────────────────────
router.get('/usuarios', usuarioController.listar);
router.get('/usuarios/:id', idUsuarioParam, validate, usuarioController.buscar);
router.post('/usuarios', cadastrarUsuarioValidation, validate, usuarioController.cadastrar);
router.put('/usuarios/:id', editarUsuarioValidation, validate, usuarioController.editar);
router.patch('/usuarios/:id/senha', alterarSenhaValidation, validate, usuarioController.alterarSenha);
router.patch('/usuarios/:id/status', alterarStatusUsuarioValidation, validate, usuarioController.alterarStatus);

module.exports = router;
