'use strict';
/**
 * Script de testes integrados da Etapa 02.
 * Testa: login, JWT, rotas protegidas, bloqueio sem auth, campanhas, participantes, sorteios, histórico.
 */
require('dotenv').config();
const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 3001}/api`;
let token = null;

function request(method, path, body, auth = false) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      method, headers,
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let passou = 0;
let falhou = 0;

function ok(label, cond, detalhe = '') {
  if (cond) { console.log(`  ✔ ${label}`); passou++; }
  else { console.log(`  ✗ ${label}${detalhe ? ': ' + detalhe : ''}`); falhou++; }
}

async function run() {
  console.log('\n=== TESTES INTEGRADOS — ETAPA 02 ===\n');

  // 1. Health check
  console.log('[1] Health check');
  const h = await request('GET', '/health');
  ok('GET /api/health retorna 200', h.status === 200);
  ok('status = ok', h.body.status === 'ok');

  // 2. Bloqueio sem token
  console.log('\n[2] Bloqueio sem autenticação');
  const sem = await request('GET', '/admin/campanhas');
  ok('GET /admin/campanhas sem token retorna 401', sem.status === 401);

  // 3. Login inválido
  console.log('\n[3] Login com credenciais inválidas');
  const loginFail = await request('POST', '/auth/login', { usuario: 'admin', senha: 'errada123' });
  ok('Login inválido retorna 401', loginFail.status === 401);

  // 4. Login válido
  console.log('\n[4] Login válido');
  const loginOk = await request('POST', '/auth/login', { usuario: 'admin', senha: 'Admin@12345' });
  ok('Login retorna 200', loginOk.status === 200);
  ok('Retorna token JWT', !!loginOk.body.token);
  ok('Token começa com eyJ (JWT)', loginOk.body.token && loginOk.body.token.startsWith('eyJ'));
  if (loginOk.body.token) token = loginOk.body.token;

  // 5. Rotas protegidas com token
  console.log('\n[5] Rotas protegidas com token válido');
  const listarC = await request('GET', '/admin/campanhas', null, true);
  ok('GET /admin/campanhas com token retorna 200', listarC.status === 200);

  // 6. Criar campanha
  console.log('\n[6] Criar campanha');
  const camp = await request('POST', '/admin/campanhas', {
    nome: 'Campanha Teste E2E', numero_inicial: 1, numero_final: 5, todos_premiados: false
  }, true);
  ok('POST /admin/campanhas retorna 201', camp.status === 201);
  ok('Campanha tem id', !!camp.body.id);
  const campanhaId = camp.body.id;

  // 7. Validação de campanha inválida
  console.log('\n[7] Validação de campanha inválida');
  const campInv = await request('POST', '/admin/campanhas', {
    nome: '', numero_inicial: 10, numero_final: 5
  }, true);
  ok('Campanha inválida retorna 400', campInv.status === 400);

  // 8. Adicionar participantes
  console.log('\n[8] Adicionar participantes');
  const p1 = await request('POST', `/admin/campanhas/${campanhaId}/participantes`, { nome: 'João Silva' }, true);
  ok('Participante 1 criado (201)', p1.status === 201);
  const p2 = await request('POST', `/admin/campanhas/${campanhaId}/participantes`, { nome: 'Maria Santos' }, true);
  ok('Participante 2 criado (201)', p2.status === 201);

  // 9. Participante duplicado
  console.log('\n[9] Participante duplicado');
  const pDup = await request('POST', `/admin/campanhas/${campanhaId}/participantes`, { nome: 'João Silva' }, true);
  ok('Participante duplicado retorna 409', pDup.status === 409);

  // 10. Normalização de nome (espaços/case)
  console.log('\n[10] Normalização de nome');
  const pNorm = await request('POST', `/admin/campanhas/${campanhaId}/participantes`, { nome: '  JOÃO  SILVA  ' }, true);
  ok('Participante normalizado duplicado retorna 409', pNorm.status === 409);

  // 11. Listar números (gerados automaticamente)
  console.log('\n[11] Listar números gerados automaticamente');
  const nums = await request('GET', `/admin/campanhas/${campanhaId}/numeros`, null, true);
  ok('Números listados (200)', nums.status === 200);
  ok('5 números gerados (1 a 5)', Array.isArray(nums.body) && nums.body.length === 5);
  const participante1Id = p1.body.id;
  const numero1Id = nums.body[0]?.id;

  // 12. Ativar campanha
  console.log('\n[12] Ativar campanha');
  const ativar = await request('PATCH', `/admin/campanhas/${campanhaId}/status`, { status: 'ativa' }, true);
  ok('Campanha ativada (200)', ativar.status === 200);

  // 13. Realizar sorteio
  console.log('\n[13] Realizar sorteio');
  const sorteio = await request('POST', `/admin/campanhas/${campanhaId}/sorteios`, {
    participante_id: participante1Id,
    numero_id: numero1Id
  }, true);
  ok('Sorteio realizado (201)', sorteio.status === 201);
  ok('Sorteio status = confirmado', sorteio.body.status === 'confirmado');
  const sorteioId = sorteio.body.id;

  // 14. Sorteio duplicado de participante
  console.log('\n[14] Sorteio duplicado de participante');
  const sDup = await request('POST', `/admin/campanhas/${campanhaId}/sorteios`, {
    participante_id: participante1Id,
    numero_id: nums.body[1]?.id
  }, true);
  ok('Sorteio duplicado participante retorna 422', sDup.status === 422);

  // 15. Sorteio duplicado de número
  console.log('\n[15] Sorteio duplicado de número');
  const sDupN = await request('POST', `/admin/campanhas/${campanhaId}/sorteios`, {
    participante_id: p2.body.id,
    numero_id: numero1Id
  }, true);
  ok('Sorteio duplicado número retorna 422', sDupN.status === 422);

  // 16. Cancelar sorteio e verificar histórico
  console.log('\n[16] Cancelar sorteio e preservar histórico');
  const cancelar = await request('PATCH', `/admin/sorteios/${sorteioId}/cancelar`, {
    motivo_cancelamento: 'Teste de cancelamento'
  }, true);
  ok('Cancelamento retorna 200', cancelar.status === 200);
  ok('Status = cancelado', cancelar.body.status === 'cancelado');
  ok('motivo_cancelamento preservado', cancelar.body.motivo_cancelamento === 'Teste de cancelamento');
  ok('cancelado_em registrado', !!cancelar.body.cancelado_em);

  // 17. Verificar que participante e número foram liberados
  console.log('\n[17] Reativação após cancelamento');
  const sorteio2 = await request('POST', `/admin/campanhas/${campanhaId}/sorteios`, {
    participante_id: participante1Id,
    numero_id: numero1Id
  }, true);
  ok('Participante e número re-sorteados após cancelamento (201)', sorteio2.status === 201);

  // 18. Listar sorteios (histórico inclui cancelados)
  console.log('\n[18] Histórico de sorteios');
  const hist = await request('GET', `/admin/campanhas/${campanhaId}/sorteios`, null, true);
  ok('Histórico listado (200)', hist.status === 200);
  const temCancelado = Array.isArray(hist.body) && hist.body.some(s => s.status === 'cancelado');
  ok('Histórico preserva registro cancelado', temCancelado);

  // 19. Token expirado/inválido
  console.log('\n[19] Token inválido');
  const tokenInv = await request('GET', '/admin/campanhas', null, false);
  // Fake token
  const req2 = {
    status: 0, body: null
  };
  const fakeResp = await new Promise(res => {
    const opts = { hostname: 'localhost', port: process.env.PORT || 3001, path: '/api/admin/campanhas', method: 'GET', headers: { Authorization: 'Bearer token_invalido_xpto' } };
    http.request(opts, r => { let d=''; r.on('data', c => d+=c); r.on('end', () => res({ status: r.statusCode })); }).end();
  });
  ok('Token inválido retorna 401', fakeResp.status === 401);

  // ─── Resumo
  console.log(`\n${'═'.repeat(40)}`);
  console.log(`RESULTADO: ${passou} aprovados, ${falhou} falhas`);
  console.log(`${'═'.repeat(40)}\n`);
  process.exit(falhou > 0 ? 1 : 0);
}

run().catch(err => { console.error('Erro nos testes:', err.message); process.exit(1); });
