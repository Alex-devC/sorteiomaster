'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');
const { createApp } = require('../src/app');
const { ensureDatabaseExists, runMigrations, closeDb, getDb } = require('../src/config/database');

const TEST_PORT = 3097;
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
  console.log('   SUÍTE DE TESTES: CANCELAMENTO & REATIVAÇÃO — ETAPA 09');
  console.log('======================================================\n');

  try {
    await ensureDatabaseExists();
    await runMigrations();

    const app = createApp();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`[Servidor de Testes] Conectado e operando na porta ${TEST_PORT}\n`);

    // ─── 1. Autenticação Administrativa ──────────────────────────────────────
    console.log('[1] Autenticação Administrativa');
    const loginRes = await requestHttp('/auth/login', { method: 'POST' }, {
      usuario: 'admin',
      senha: 'Admin@12345'
    });
    ok('Login realizado com sucesso (200)', loginRes.status === 200 && !!loginRes.data.token);
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // ─── 2. Preparação de Campanha e Participantes ───────────────────────────
    console.log('\n[2] Preparação do Cenário de Teste');
    const nomeCamp = `Campanha Cancelamento/Reativação ${Date.now()}`;
    const campRes = await requestHttp('/admin/campanhas', { method: 'POST', headers: authHeaders }, {
      nome: nomeCamp,
      tipo_sorteio: 'numeros_ordem',
      numero_inicial: 50,
      numero_final: 60
    });
    ok('Campanha de teste criada com sucesso (201)', campRes.status === 201);
    const campId = campRes.data.id;

    // Ativar campanha
    await requestHttp(`/admin/campanhas/${campId}/status`, { method: 'PATCH', headers: authHeaders }, { status: 'ativa' });

    // Cadastrar 3 participantes
    const p1 = await requestHttp(`/admin/campanhas/${campId}/participantes`, { method: 'POST', headers: authHeaders }, { nome: 'Lucas Mendonça' });
    const p2 = await requestHttp(`/admin/campanhas/${campId}/participantes`, { method: 'POST', headers: authHeaders }, { nome: 'Fernanda Rocha' });
    const p3 = await requestHttp(`/admin/campanhas/${campId}/participantes`, { method: 'POST', headers: authHeaders }, { nome: 'Gabriel Souza' });
    ok('3 participantes cadastrados com sucesso', p1.status === 201 && p2.status === 201 && p3.status === 201);

    // ─── 3. Realizar Sorteio Inicial ─────────────────────────────────────────
    console.log('\n[3] Realização de Sorteio Inicial');
    const sorteio1Res = await requestHttp(`/admin/campanhas/${campId}/sorteios`, { method: 'POST', headers: authHeaders }, {
      participante_id: p1.data.id
    });
    ok('Sorteio 1 realizado com sucesso (201)', sorteio1Res.status === 201);
    const s1Id = sorteio1Res.data.id;
    const numSorteado1 = sorteio1Res.data.numero_sorteado;
    const numId1 = sorteio1Res.data.numero_id;

    // Verificar que participante e número estão 'sorteado'
    const part1Db = await getDb()('participantes').where({ id: p1.data.id }).first();
    const num1Db = await getDb()('numeros').where({ id: numId1 }).first();
    ok('Participante marcado como "sorteado"', part1Db.status === 'sorteado');
    ok('Número marcado como "sorteado"', num1Db.status === 'sorteado');

    // ─── 4. Validação de Motivo Obrigatório no Cancelamento ──────────────────
    console.log('\n[4] Exigência do Motivo de Cancelamento');
    const cancelSemMotivo = await requestHttp(`/admin/sorteios/${s1Id}/cancelar`, { method: 'PATCH', headers: authHeaders }, {});
    ok('Tentativa de cancelar sem motivo rejeitada com 400 ou 422', cancelSemMotivo.status === 400 || cancelSemMotivo.status === 422);

    const cancelMotivoCurto = await requestHttp(`/admin/sorteios/${s1Id}/cancelar`, { method: 'PATCH', headers: authHeaders }, {
      motivo_cancelamento: 'ab'
    });
    ok('Tentativa com motivo com menos de 3 caracteres rejeitada', cancelMotivoCurto.status === 400 || cancelMotivoCurto.status === 422);

    // ─── 5. Cancelamento Válido de Sorteio Ativo ─────────────────────────────
    console.log('\n[5] Cancelamento Válido de Sorteio Ativo');
    const cancelamentoOk = await requestHttp(`/admin/sorteios/${s1Id}/cancelar`, { method: 'PATCH', headers: authHeaders }, {
      motivo_cancelamento: 'Participante estava ausente no momento da chamada oficial.'
    });
    ok('Cancelamento executado com sucesso (200)', cancelamentoOk.status === 200);
    ok('Status do sorteio atualizado para "cancelado"', cancelamentoOk.data.status === 'cancelado');
    ok('Data de cancelamento registrada', !!cancelamentoOk.data.cancelado_em);
    ok('Motivo do cancelamento preservado no retorno', cancelamentoOk.data.motivo_cancelamento === 'Participante estava ausente no momento da chamada oficial.');

    // ─── 6. Confirmação de Liberação do Participante e Número ────────────────
    console.log('\n[6] Confirmação da Liberação no Banco de Dados');
    const part1Liberado = await getDb()('participantes').where({ id: p1.data.id }).first();
    const num1Liberado = await getDb()('numeros').where({ id: numId1 }).first();
    ok('Participante voltou para status "disponivel"', part1Liberado.status === 'disponivel');
    ok('Número original exato voltou para status "disponivel"', num1Liberado.status === 'disponivel');

    // ─── 7. Impedir Cancelamento Duplicado (Idempotência / Proteção) ────────
    console.log('\n[7] Bloqueio de Cancelamento Duplicado');
    const cancelDuplicado = await requestHttp(`/admin/sorteios/${s1Id}/cancelar`, { method: 'PATCH', headers: authHeaders }, {
      motivo_cancelamento: 'Tentando cancelar novamente'
    });
    ok('Tentativa de cancelar sorteio já cancelado rejeitada com 422', cancelDuplicado.status === 422);

    // ─── 8. Reativação Válida do Sorteio Cancelado ───────────────────────────
    console.log('\n[8] Reativação Válida do Sorteio');
    const reativarOk = await requestHttp(`/admin/sorteios/${s1Id}/reativar`, { method: 'PATCH', headers: authHeaders });
    ok('Reativação executada com sucesso (200)', reativarOk.status === 200);
    ok('Status do sorteio retornou para "confirmado"', reativarOk.data.status === 'confirmado');
    ok('cancelado_em limpo (null)', reativarOk.data.cancelado_em === null);
    ok('Participante correto mantido no sorteio', reativarOk.data.participante_id === p1.data.id);
    ok('Número original mantido no sorteio', reativarOk.data.numero_sorteado === numSorteado1);

    // ─── 9. Confirmar Novo Bloqueio de Participante e Número ────────────────
    console.log('\n[9] Confirmação de Rebloqueio no Banco de Dados');
    const part1Rebloqueado = await getDb()('participantes').where({ id: p1.data.id }).first();
    const num1Rebloqueado = await getDb()('numeros').where({ id: numId1 }).first();
    ok('Participante marcado novamente como "sorteado"', part1Rebloqueado.status === 'sorteado');
    ok('Número marcado novamente como "sorteado"', num1Rebloqueado.status === 'sorteado');

    // ─── 10. Impedir Reativação Duplicada ────────────────────────────────────
    console.log('\n[10] Bloqueio de Reativação Duplicada');
    const reativarDuplicado = await requestHttp(`/admin/sorteios/${s1Id}/reativar`, { method: 'PATCH', headers: authHeaders });
    ok('Tentativa de reativar sorteio já ativo rejeitada com 422', reativarDuplicado.status === 422);

    // ─── 11. Conflito: Impedir Reativação quando Participante Ocupado ────────
    console.log('\n[11] Conflito: Participante Ocupado em Outro Sorteio');
    // 11.1 Cancela o sorteio 1 novamente
    await requestHttp(`/admin/sorteios/${s1Id}/cancelar`, { method: 'PATCH', headers: authHeaders }, {
      motivo_cancelamento: 'Teste de conflito de participante'
    });

    // 11.2 Realiza um novo sorteio para o mesmo participante p1 (que estava liberado)
    const sorteioNovoP1 = await requestHttp(`/admin/campanhas/${campId}/sorteios`, { method: 'POST', headers: authHeaders }, {
      participante_id: p1.data.id
    });
    ok('Novo sorteio realizado para o mesmo participante com outro número', sorteioNovoP1.status === 201);

    // 11.3 Tenta reativar o sorteio 1 original (o participante agora já está em sorteioNovoP1)
    const conflitoPart = await requestHttp(`/admin/sorteios/${s1Id}/reativar`, { method: 'PATCH', headers: authHeaders });
    ok('Reativação bloqueada com 409 ou 422 (participante já possui resultado ativo)', conflitoPart.status === 409 || conflitoPart.status === 422);

    // ─── 12. Conflito: Impedir Reativação quando Número Ocupado ──────────────
    console.log('\n[12] Conflito: Número Ocupado em Outro Sorteio');
    // Cria um sorteio para p2 com número específico se necessário ou simula ocupação do número numId1
    // Cancela o sorteioNovoP1 para liberar p1
    await requestHttp(`/admin/sorteios/${sorteioNovoP1.data.id}/cancelar`, { method: 'PATCH', headers: authHeaders }, {
      motivo_cancelamento: 'Liberando p1'
    });

    // Agora p1 está livre, mas vamos marcar o número original numId1 como sorteado por p2
    await getDb()('numeros').where({ id: numId1 }).update({ status: 'sorteado' });

    const conflitoNum = await requestHttp(`/admin/sorteios/${s1Id}/reativar`, { method: 'PATCH', headers: authHeaders });
    ok('Reativação bloqueada com 409 ou 422 (número indisponível)', conflitoNum.status === 409 || conflitoNum.status === 422);

    // Restaura status do número para teste de integridade
    await getDb()('numeros').where({ id: numId1 }).update({ status: 'disponivel' });

    // ─── 13. Preservação do Histórico de Resultados ─────────────────────────
    console.log('\n[13] Preservação do Histórico Completo da Campanha');
    const todosSorteios = await requestHttp(`/admin/campanhas/${campId}/sorteios`, { headers: authHeaders });
    ok('Todos os sorteios permanecem registrados no histórico', todosSorteios.data.length >= 2);
    ok('Nenhum registro foi deletado do banco de dados (tabela sorteios)', todosSorteios.data.some(s => s.id === s1Id));

    // ─── 14. Concorrência e Bloqueio Transacional (Race Condition) ──────────
    console.log('\n[14] Teste de Concorrência e Transação Atômica');
    // Dispara dois cancelamentos simultâneos sobre o sorteioNovoP1 (ou um novo sorteio ativo)
    const sorteioConcorrente = await requestHttp(`/admin/campanhas/${campId}/sorteios`, { method: 'POST', headers: authHeaders }, {
      participante_id: p3.data.id
    });
    ok('Sorteio concorrente criado para teste (201)', sorteioConcorrente.status === 201);
    const sConcId = sorteioConcorrente.data.id;

    // Disparar requisições paralelas simultâneas de cancelamento
    const [resConc1, resConc2] = await Promise.all([
      requestHttp(`/admin/sorteios/${sConcId}/cancelar`, { method: 'PATCH', headers: authHeaders }, { motivo_cancelamento: 'Cancelamento paralelo 1' }),
      requestHttp(`/admin/sorteios/${sConcId}/cancelar`, { method: 'PATCH', headers: authHeaders }, { motivo_cancelamento: 'Cancelamento paralelo 2' })
    ]);

    const umPassou = (resConc1.status === 200 && resConc2.status === 422) || (resConc2.status === 200 && resConc1.status === 422);
    ok('Transação bloqueou cancelamento simultâneo duplicado (apenas 1 obteve 200 e o outro 422)', umPassou);

    // ─── 15. Resumo Final ───────────────────────────────────────────────────
    console.log('\n=======================================================');
    console.log(`TOTAL DE TESTES EXECUTADOS: ${passou + falhou}`);
    console.log(`APROVADOS: ${passou} | FALHAS: ${falhou}`);
    console.log('=======================================================\n');

    if (falhou > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Erro inesperado durante a suíte de testes:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await closeDb();
  }
}

run();
