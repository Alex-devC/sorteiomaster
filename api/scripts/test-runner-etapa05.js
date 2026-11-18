'use strict';

require('dotenv').config();
const http = require('http');
const { createApp } = require('../src/app');
const { ensureDatabaseExists, runMigrations, closeDb } = require('../src/config/database');

const TEST_PORT = 3098;
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
      headers: options.headers || {},
    };

    if (body) {
      const data = JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', (d) => (raw += d));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: raw });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('   SUÍTE DE TESTES E VALIDAÇÃO DE CAMPANHAS — ETAPA 05');
  console.log('======================================================\n');

  await ensureDatabaseExists();
  await runMigrations();

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`[Servidor de Testes] Conectado e operando na porta ${TEST_PORT}\n`);
      resolve();
    });
  });

  // 1. Obter Token com Login Válido
  console.log('[1] Autenticação Administrativa');
  const loginRes = await requestHttp('/auth/login', { method: 'POST' }, {
    usuario: 'admin',
    senha: 'Admin@12345'
  });
  ok('Login administrativo retorna token JWT', loginRes.status === 200 && !!loginRes.body.token);
  const token = loginRes.body.token;

  // 2. Listagem de Campanhas
  console.log('\n[2] Listagem de Campanhas (GET /api/admin/campanhas)');
  const listRes = await requestHttp('/admin/campanhas', {
    headers: { Authorization: `Bearer ${token}` }
  });
  ok('Listagem retorna status 200 e array', listRes.status === 200 && Array.isArray(listRes.body));

  // 3. Cadastro de Campanha com Dados Inválidos
  console.log('\n[3] Validação de Cadastro com Dados Inválidos');
  const campInvalida = await requestHttp('/admin/campanhas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    nome: '',
    numero_inicial: 50,
    numero_final: 20
  });
  ok('Cadastro inválido (fim < ini) rejeitado com HTTP 400', campInvalida.status === 400);

  // 4. Cadastro de Campanha Válida
  console.log('\n[4] Cadastro de Campanha Válida (POST /api/admin/campanhas)');
  const campValida = await requestHttp('/admin/campanhas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    nome: 'Campanha Teste Etapa 05',
    numero_inicial: 200,
    numero_final: 210,
    todos_premiados: true
  });
  ok('Criação de campanha retorna HTTP 201', campValida.status === 201);
  ok('Campanha criada possui ID e status em_preparacao', campValida.body.id && campValida.body.status === 'em_preparacao');
  const campId = campValida.body.id;

  // 5. Consulta de Detalhes da Campanha
  console.log('\n[5] Consulta de Detalhes (GET /api/admin/campanhas/:id)');
  const detalheRes = await requestHttp(`/admin/campanhas/${campId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  ok('Consulta individual retorna HTTP 200', detalheRes.status === 200);
  ok('Dados de nome e intervalo conferem', detalheRes.body.nome === 'Campanha Teste Etapa 05' && detalheRes.body.numero_inicial === 200);

  // 6. Edição de Campanha em Preparação
  console.log('\n[6] Edição de Campanha (PUT /api/admin/campanhas/:id)');
  const editRes = await requestHttp(`/admin/campanhas/${campId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    nome: 'Campanha Teste E05 Atualizada',
    numero_inicial: 200,
    numero_final: 205,
    todos_premiados: false
  });
  ok('Edição retorna HTTP 200', editRes.status === 200);
  ok('Intervalo numérico recalculado na edição', editRes.body.numero_final === 205 && editRes.body.todos_premiados === 0);

  // 7. Consulta de Conferência
  console.log('\n[7] Consulta da Conferência (GET /api/admin/campanhas/:id/conferencia)');
  const confRes = await requestHttp(`/admin/campanhas/${campId}/conferencia`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  ok('Conferência retorna HTTP 200', confRes.status === 200);
  ok('Conferência contém números e participantes estruturados',
    confRes.body.numeros.total === 6 &&
    confRes.body.participantes.total === 0 &&
    confRes.body.compativel === true
  );

  // 8. Transição de Status Permitida: em_preparacao -> ativa
  console.log('\n[8] Transição de Status: em_preparacao -> ativa');
  const statusAtiva = await requestHttp(`/admin/campanhas/${campId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    status: 'ativa'
  });
  ok('Ativação da campanha retorna HTTP 200', statusAtiva.status === 200);
  ok('Status atualizado para ativa', statusAtiva.body.status === 'ativa');

  // 9. Tentativa de Edição em Campanha Ativa (deve ser rejeitada pelo backend)
  console.log('\n[9] Bloqueio de Edição em Campanha Ativa');
  const editBloqueada = await requestHttp(`/admin/campanhas/${campId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    nome: 'Tentativa de Alteração Ilegal'
  });
  ok('Edição em campanha ativa rejeitada com HTTP 422', editBloqueada.status === 422);

  // 10. Tentativa de Transição Inválida (ex: ativa -> em_preparacao)
  console.log('\n[10] Bloqueio de Transição de Status Não Permitida');
  const transicaoInvalida = await requestHttp(`/admin/campanhas/${campId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    status: 'em_preparacao'
  });
  ok('Transição proibida ativa -> em_preparacao rejeitada com HTTP 422', transicaoInvalida.status === 422);

  // 11. Transição Permitida: ativa -> finalizada
  console.log('\n[11] Transição de Status: ativa -> finalizada');
  const statusFinalizada = await requestHttp(`/admin/campanhas/${campId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }, {
    status: 'finalizada'
  });
  ok('Finalização de campanha retorna HTTP 200', statusFinalizada.status === 200);
  ok('Status atualizado para finalizada', statusFinalizada.body.status === 'finalizada');

  // Fechar servidor e conexões com o banco
  await new Promise((res) => server.close(res));
  await closeDb();

  // ─── RESUMO FINAL
  console.log(`\n${'='.repeat(55)}`);
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passou + falhou}`);
  console.log(`APROVADOS: ${passou} | FALHAS: ${falhou}`);
  console.log(`${'='.repeat(55)}\n`);

  process.exit(falhou > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error('Erro na execução dos testes:', err);
  if (server) await new Promise((res) => server.close(res));
  await closeDb();
  process.exit(1);
});
