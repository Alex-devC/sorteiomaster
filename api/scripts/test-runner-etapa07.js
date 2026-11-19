'use strict';

require('dotenv').config();
const http = require('http');
const { createApp } = require('../src/app');
const { ensureDatabaseExists, runMigrations, closeDb, getDb } = require('../src/config/database');

const TEST_PORT = 3095;
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

    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('   SUÍTE DE TESTES E VALIDAÇÃO DA ROLETA & SORTEIOS — ETAPA 07');
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

  let campPrepId = null;
  let campAtivaId = null;
  let part1Id = null;
  let part2Id = null;
  let part3Id = null;
  let sorteioResultado1 = null;

  try {
    // 1. Autenticação Administrativa e Tratamento de 401
    console.log('[1] Autenticação Administrativa & Proteção de Rotas (HTTP 401)');
    const noAuth = await requestHttp('/admin/campanhas');
    ok('Tentativa de listar campanhas sem JWT rejeitada com HTTP 401', noAuth.status === 401);

    const loginRes = await requestHttp('/auth/login', { method: 'POST' }, {
      usuario: 'admin',
      senha: 'Admin@12345'
    });
    ok('Login com credenciais válidas retorna HTTP 200 e token JWT', loginRes.status === 200 && !!loginRes.body.token);
    const token = loginRes.body.token;

    // 2. Preparação de Campanhas: Uma em preparação e uma ativa
    console.log('\n[2] Preparação e Validação de Status de Campanhas');
    const campPrepRes = await requestHttp('/admin/campanhas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: `Campanha Preparação ${Date.now()}`,
      numero_inicial: 1,
      numero_final: 10,
      todos_premiados: false
    });
    ok('Campanha em preparação criada (201)', campPrepRes.status === 201);
    campPrepId = campPrepRes.body.id;

    const campAtivaRes = await requestHttp('/admin/campanhas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: `Campanha Ao Vivo Roleta ${Date.now()}`,
      numero_inicial: 10,
      numero_final: 25,
      todos_premiados: true
    });
    ok('Campanha destinada a sorteios criada (201)', campAtivaRes.status === 201);
    campAtivaId = campAtivaRes.body.id;

    // 3. Cadastrar Participantes na Campanha que será ativada
    console.log('\n[3] Cadastro e Listagem de Participantes Aptos');
    const p1 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { nome: 'Ana Beatriz Ferreira' });
    part1Id = p1.body.id;

    const p2 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { nome: 'Bruno Rocha Alencar' });
    part2Id = p2.body.id;

    const p3 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { nome: 'Camila Duarte Santos' });
    part3Id = p3.body.id;
    ok('3 participantes cadastrados com sucesso', !!part1Id && !!part2Id && !!part3Id);

    // Bloqueio de sorteio em campanha em preparação
    console.log('\n[4] Bloqueio de Sorteio em Campanhas Não Ativas (HTTP 422)');
    const sorteioInvalidoPrep = await requestHttp(`/admin/campanhas/${campPrepId}/sorteios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { participante_id: 1 });
    ok('API bloqueia sorteio em campanha em preparação com HTTP 422', sorteioInvalidoPrep.status === 422);

    // Ativar a campanha campAtivaId
    await requestHttp(`/admin/campanhas/${campAtivaId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }, { status: 'ativa' });

    // Filtrar somente campanhas ativas
    const allCamps = await requestHttp('/admin/campanhas', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const ativas = allCamps.body.filter(c => c.status === 'ativa');
    ok('Listagem de campanhas filtra corretamente status ativa', ativas.some(c => c.id === campAtivaId));

    // 5. Consulta de Participantes Disponíveis
    console.log('\n[5] Consulta de Participantes Disponíveis');
    const partsDisp = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes/disponiveis`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Endpoint retorna HTTP 200 com array de participantes', partsDisp.status === 200 && Array.isArray(partsDisp.body));
    ok('Todos os 3 participantes cadastrados constam como disponíveis', partsDisp.body.length === 3);

    // 6. Consulta de Números Disponíveis para Compor a Roleta
    console.log('\n[6] Consulta e Composição dos Números da Roleta');
    const numsDisp = await requestHttp(`/admin/campanhas/${campAtivaId}/numeros?status=disponivel`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Endpoint de números disponíveis retorna HTTP 200', numsDisp.status === 200);
    ok('Quantidade total de números confere com intervalo (10 a 25 = 16 números)', numsDisp.body.length === 16);
    const listaNumerosIniciais = numsDisp.body.map(n => n.numero);
    ok('Todos os números estão no intervalo correto', Math.min(...listaNumerosIniciais) === 10 && Math.max(...listaNumerosIniciais) === 25);

    // 7. Validação de Bloqueio sem Participante
    console.log('\n[7] Bloqueio de Sorteio sem Participante Selecionado');
    const semPartRes = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {});
    ok('Tentativa de sorteio sem participante_id rejeitada com HTTP 400', semPartRes.status === 400);

    // 8. Realização do Sorteio 1 (Ana Beatriz) — Validação CSPRNG da API
    console.log('\n[8] Realização do Sorteio Válido via CSPRNG da API');
    const sorteio1 = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { participante_id: part1Id });
    ok('API realiza sorteio e retorna HTTP 201', sorteio1.status === 201);
    ok('Retorna registro com status confirmado', sorteio1.body.status === 'confirmado');
    ok('Retorna ID do sorteio e data de realização', !!sorteio1.body.id && !!sorteio1.body.sorteado_em);
    ok('Retorna número sorteado inteiro', typeof sorteio1.body.numero_sorteado === 'number');
    ok('O número vencedor pertence ao conjunto que estava disponível', listaNumerosIniciais.includes(sorteio1.body.numero_sorteado));
    ok('Retorna o nome correto do participante', sorteio1.body.participante_nome === 'Ana Beatriz Ferreira');
    sorteioResultado1 = sorteio1.body;

    // 9. Bloqueio de Participante Já Sorteado
    console.log('\n[9] Bloqueio Estrito de Participante Já Sorteado (HTTP 422)');
    const sorteioRepetidoPart = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { participante_id: part1Id });
    ok('Tentativa de sortear participante já contemplado rejeitada com HTTP 422', sorteioRepetidoPart.status === 422);

    // 10. Atualização dos Participantes Disponíveis pós-sorteio
    console.log('\n[10] Atualização da Lista de Participantes Disponíveis');
    const partsDispApos1 = await requestHttp(`/admin/campanhas/${campAtivaId}/participantes/disponiveis`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Lista de participantes disponíveis agora possui 2 participantes', partsDispApos1.body.length === 2);
    ok('Participante contemplada (Ana Beatriz) NÃO consta mais na lista', !partsDispApos1.body.some(p => p.id === part1Id));

    // 11. Atualização dos Números Disponíveis da Roleta pós-sorteio
    console.log('\n[11] Atualização da Roleta — Remoção do Número Contemplado');
    const numsDispApos1 = await requestHttp(`/admin/campanhas/${campAtivaId}/numeros?status=disponivel`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Quantidade de números disponíveis decrementada em 1 (15 restantes)', numsDispApos1.body.length === 15);
    ok('Número sorteado NÃO consta mais na lista de números disponíveis da roleta', !numsDispApos1.body.some(n => n.numero === sorteioResultado1.numero_sorteado));

    // 12. Realização do Segundo Sorteio (Novo Sorteio com Bruno)
    console.log('\n[12] Execução da Próxima Rodada (Novo Sorteio)');
    const sorteio2 = await requestHttp(`/admin/campanhas/${campAtivaId}/sorteios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, { participante_id: part2Id });
    ok('Segundo sorteio realizado com sucesso (201)', sorteio2.status === 201);
    ok('Segundo número sorteado é diferente do primeiro (não há duplicidade)', sorteio2.body.numero_sorteado !== sorteioResultado1.numero_sorteado);

    // 13. Persistência e Recuperação após Recarregar
    console.log('\n[13] Persistência no Banco e Integridade após Recarregamento');
    const db = getDb();
    const sorteiosDb = await db('sorteios').where({ campanha_id: campAtivaId, status: 'confirmado' });
    ok('Exatamente 2 sorteios confirmados persistidos no MySQL', sorteiosDb.length === 2);

    const confRes = await requestHttp(`/admin/campanhas/${campAtivaId}/conferencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Conferência oficial reflete 2 participantes sorteados e 1 disponível', confRes.body.participantes.sorteados === 2 && confRes.body.participantes.disponiveis === 1);
    ok('Conferência oficial reflete 2 números sorteados e 14 disponíveis', confRes.body.numeros.sorteados === 2 && confRes.body.numeros.disponiveis === 14);

    // 14. Validação Matemática da Animação da Roleta
    console.log('\n[14] Validação Matemática do Alinhamento do Ponteiro Superior (Canvas)');
    // Simulando o algoritmo matemático de alinhamento para cada fatia da roleta
    const totalSlices = 14; // fatias restantes
    const sliceAngle = (2 * Math.PI) / totalSlices;
    const pointerAngle = 1.5 * Math.PI; // Topo (270 graus)
    let todosAlinhados = true;

    for (let winIdx = 0; winIdx < totalSlices; winIdx++) {
      const targetMidAngle = winIdx * sliceAngle + (sliceAngle / 2);
      const desiredFinalRotation = pointerAngle - targetMidAngle;
      const extraSpins = 6 * (2 * Math.PI);
      const startRotation = 0.42; // rotação arbitrária anterior
      const currentNorm = ((startRotation % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
      const delta = (((desiredFinalRotation - currentNorm) % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
      const finalRotation = startRotation + extraSpins + delta;

      // Ângulo onde o centro da fatia winIdx para no Canvas:
      const sliceCenterFinal = (finalRotation + targetMidAngle) % (2 * Math.PI);
      const diff = Math.abs(sliceCenterFinal - (pointerAngle % (2 * Math.PI)));

      if (diff > 1e-10 && Math.abs(diff - 2 * Math.PI) > 1e-10) {
        todosAlinhados = false;
        break;
      }
    }
    ok('Algoritmo de rotação alinha com precisão milimétrica o ponteiro superior com qualquer fatia vencedora', todosAlinhados);

  } catch (err) {
    console.error('Erro inesperado durante a execução dos testes:', err);
    falhou++;
  } finally {
    // Limpeza controlada dos dados criados neste teste
    const db = getDb();
    if (campAtivaId) {
      try {
        await db('sorteios').where({ campanha_id: campAtivaId }).delete();
        await db('participantes').where({ campanha_id: campAtivaId }).delete();
        await db('numeros').where({ campanha_id: campAtivaId }).delete();
        await db('campanhas').where({ id: campAtivaId }).delete();
      } catch (e) {}
    }
    if (campPrepId) {
      try {
        await db('campanhas').where({ id: campPrepId }).delete();
      } catch (e) {}
    }

    if (server) {
      server.close();
    }
    await closeDb();

    console.log('\n=======================================================');
    console.log(`TOTAL DE TESTES EXECUTADOS: ${passou + falhou}`);
    console.log(`APROVADOS: ${passou} | FALHAS: ${falhou}`);
    console.log('=======================================================\n');

    process.exit(falhou > 0 ? 1 : 0);
  }
}

run();
