'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');
const { createApp } = require('../src/app');
const { ensureDatabaseExists, runMigrations, closeDb, getDb } = require('../src/config/database');

const TEST_PORT = 3096;
let server;
let passou = 0;
let falhou = 0;

function ok(label, cond, detalhe = '') {
  if (cond) {
    console.log(`  ✔ ${label}`);
    passou++;
  } else {
    console.log(`  ✗ ${label}${detalhe ? ': ' + detalhe : ''}`);
    falhou++;
  }
}

function requestHttp(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api' + path,
      method: options.method || 'GET',
      headers: { ...(options.headers || {}) },
    };

    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('   SUÍTE DE TESTES E VALIDAÇÃO DE HISTÓRICO — ETAPA 08');
  console.log('======================================================\n');

  try {
    await ensureDatabaseExists();
    await runMigrations();

    const app = createApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`[Servidor de Testes] Conectado e operando na porta ${TEST_PORT}\n`);

    // ─── 1. Autenticação e Proteção de Rotas ─────────────────────────────────
    console.log('[1] Autenticação e Proteção de Rotas (HTTP 401)');
    const unauthList = await requestHttp('/admin/campanhas/1/sorteios');
    ok('Tentativa de listar histórico de sorteios sem JWT rejeitada com 401', unauthList.status === 401);

    const unauthDetail = await requestHttp('/admin/sorteios/1');
    ok('Tentativa de consultar detalhes de sorteio sem JWT rejeitada com 401', unauthDetail.status === 401);

    const loginRes = await requestHttp('/auth/login', { method: 'POST' }, {
      usuario: 'admin',
      senha: 'Admin@12345'
    });
    ok('Login do administrador realizado com sucesso (200)', loginRes.status === 200 && !!loginRes.data.token);
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // ─── 2. Campanha Sem Sorteios (Empty State da API) ──────────────────────
    console.log('\n[2] Consulta em Campanha Sem Sorteios');
    const nomeCampVazia = `Campanha Vazia Teste ${Date.now()}`;
    const campVaziaRes = await requestHttp('/admin/campanhas', { method: 'POST', headers: authHeaders }, {
      nome: nomeCampVazia,
      tipo_sorteio: 'numeros_ordem',
      numero_inicial: 1,
      numero_final: 10
    });
    ok('Campanha sem sorteios criada com sucesso (201)', campVaziaRes.status === 201);
    const campVaziaId = campVaziaRes.data.id;

    const listVaziaRes = await requestHttp(`/admin/campanhas/${campVaziaId}/sorteios`, { headers: authHeaders });
    ok('Consulta de sorteios de campanha sem sorteios retorna HTTP 200', listVaziaRes.status === 200);
    ok('Retorna lista vazia (array vazio [])', Array.isArray(listVaziaRes.data) && listVaziaRes.data.length === 0);

    // ─── 3. Preparação de Campanha Ativa e Sorteios ──────────────────────────
    console.log('\n[3] Preparação de Campanha com Resultados de Sorteios');
    const nomeCampAtiva = `Campanha Histórico Audit ${Date.now()}`;
    const campAtivaRes = await requestHttp('/admin/campanhas', { method: 'POST', headers: authHeaders }, {
      nome: nomeCampAtiva,
      tipo_sorteio: 'numeros_ordem',
      numero_inicial: 100,
      numero_final: 109
    });
    ok('Campanha de teste criada com sucesso (201)', campAtivaRes.status === 201);
    const campAtivaId = campAtivaRes.data.id;

    // Ativar campanha
    await requestHttp(`/admin/campanhas/${campAtivaId}/status`, { method: 'PATCH', headers: authHeaders }, {
      status: 'ativa'
    });

    // Cadastrar participantes
    const p1 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes`, { method: 'POST', headers: authHeaders }, { nome: 'Carlos Silva' });
    const p2 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes`, { method: 'POST', headers: authHeaders }, { nome: 'Mariana Duarte' });
    const p3 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes`, { method: 'POST', headers: authHeaders }, { nome: 'Roberto Faria' });
    const p4 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes`, { method: 'POST', headers: authHeaders }, { nome: 'Vanessa Lima' });
    ok('4 participantes cadastrados com sucesso', p1.status === 201 && p2.status === 201 && p3.status === 201 && p4.status === 201);

    // Realizar 3 sorteios
    const s1 = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, { method: 'POST', headers: authHeaders }, { participante_id: p1.data.id });
    const s2 = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, { method: 'POST', headers: authHeaders }, { participante_id: p2.data.id });
    const s3 = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, { method: 'POST', headers: authHeaders }, { participante_id: p3.data.id });
    ok('3 sorteios realizados via API com sucesso (201)', s1.status === 201 && s2.status === 201 && s3.status === 201);

    // Cancelar o terceiro sorteio
    const cancelRes = await requestHttp(`/admin/sorteios/${s3.data.id}/cancelar`, { method: 'PATCH', headers: authHeaders }, {
      motivo_cancelamento: 'Participante não atendeu aos critérios do regulamento'
    });
    ok('Cancelamento de um dos sorteios efetuado com sucesso (200)', cancelRes.status === 200 && cancelRes.data.status === 'cancelado');

    // ─── 4. Listagem Geral do Histórico e Integridade dos Registros ──────────
    console.log('\n[4] Listagem e Integridade dos Registros de Histórico');
    const historicoGeral = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, { headers: authHeaders });
    ok('Endpoint de listagem retorna HTTP 200', historicoGeral.status === 200);
    ok('Total de sorteios listados confere exatamente (3 sorteios)', historicoGeral.data.length === 3);

    const itemConfirmado = historicoGeral.data.find(i => i.id === s1.data.id);
    const itemCancelado = historicoGeral.data.find(i => i.id === s3.data.id);

    ok('Registro ativo possui status "confirmado"', itemConfirmado && itemConfirmado.status === 'confirmado');
    ok('Registro ativo traz número sorteado e nome do participante', itemConfirmado && itemConfirmado.numero_sorteado !== undefined && itemConfirmado.participante_nome === 'Carlos Silva');
    ok('Registro ativo traz data/hora do sorteio (sorteado_em)', !!itemConfirmado?.sorteado_em);

    ok('Registro cancelado possui status "cancelado"', itemCancelado && itemCancelado.status === 'cancelado');
    ok('Registro cancelado contém cancelado_em preenchido', !!itemCancelado?.cancelado_em);
    ok('Registro cancelado preserva motivo do cancelamento', itemCancelado?.motivo_cancelamento === 'Participante não atendeu aos critérios do regulamento');

    // ─── 5. Separação e Filtros por Situação ────────────────────────────────
    console.log('\n[5] Separação e Filtros por Situação (Ativos vs Cancelados)');
    const filtroAtivos = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios?status=confirmado`, { headers: authHeaders });
    ok('Filtro status=confirmado retorna apenas sorteios ativos (2)', filtroAtivos.data.length === 2 && filtroAtivos.data.every(s => s.status === 'confirmado'));

    const filtroRealizadosCompat = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios?status=realizado`, { headers: authHeaders });
    ok('Filtro status=realizado mapeado com sucesso para confirmados (2)', filtroRealizadosCompat.data.length === 2);

    const filtroCancelados = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios?status=cancelado`, { headers: authHeaders });
    ok('Filtro status=cancelado retorna exatamente 1 sorteio cancelado', filtroCancelados.data.length === 1 && filtroCancelados.data[0].status === 'cancelado');

    // ─── 6. Filtros por Número Sorteado e Participante ──────────────────────
    console.log('\n[6] Filtros por Número Sorteado e Participante');
    const numSorteadoS2 = s2.data.numero_sorteado;
    const filtroNum = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios?numero=${numSorteadoS2}`, { headers: authHeaders });
    ok('Filtro por número sorteado retorna o registro correto', filtroNum.data.length === 1 && filtroNum.data[0].numero_sorteado === numSorteadoS2);

    const filtroPartId = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios?participante_id=${p1.data.id}`, { headers: authHeaders });
    ok('Filtro por participante_id retorna o sorteio de Carlos Silva', filtroPartId.data.length === 1 && filtroPartId.data[0].participante_nome === 'Carlos Silva');

    const filtroNomePart = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios?busca=Mariana`, { headers: authHeaders });
    ok('Filtro por busca textual de participante retorna Mariana Duarte', filtroNomePart.data.length === 1 && filtroNomePart.data[0].participante_nome === 'Mariana Duarte');

    const filtroSemResultado = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios?numero=99999`, { headers: authHeaders });
    ok('Filtro sem correspondência retorna array vazio [] com HTTP 200', filtroSemResultado.status === 200 && filtroSemResultado.data.length === 0);

    // ─── 7. Detalhes Individuais do Sorteio ──────────────────────────────────
    console.log('\n[7] Detalhes Individuais do Sorteio (GET /api/admin/sorteios/:id)');
    const detalhesRes = await requestHttp(`/admin/sorteios/${s1.data.id}`, { headers: authHeaders });
    ok('Consulta de detalhes do sorteio retorna HTTP 200', detalhesRes.status === 200);
    ok('Retorna registro completo com número e participante', detalhesRes.data.id === s1.data.id && detalhesRes.data.participante_nome === 'Carlos Silva');

    const detalhesNotFound = await requestHttp('/admin/sorteios/99999999', { headers: authHeaders });
    ok('Consulta de ID inexistente retorna HTTP 404', detalhesNotFound.status === 404);

    // ─── 8. Resumo dos Resultados ───────────────────────────────────────────
    console.log('\n=======================================================');
    console.log(`TOTAL DE TESTES EXECUTADOS: ${passou + falhou}`);
    console.log(`APROVADOS: ${passou} | FALHAS: ${falhou}`);
    console.log('=======================================================\n');

    if (falhou > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Erro inesperado durante os testes:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await closeDb();
  }
}

run();
