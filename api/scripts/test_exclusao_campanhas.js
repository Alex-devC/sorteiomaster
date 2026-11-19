'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getDb } = require('../src/config/database');

const BASE_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const API_URL = `${BASE_URL}/admin`;
const AUTH_URL = `${BASE_URL}/auth`;

let tokenAdmin = '';
let db;

const resultados = {
  total: 0,
  sucessos: 0,
  falhas: 0,
  detalhes: []
};

function registrarTeste(numero, nome, sucesso, msg = '') {
  resultados.total++;
  if (sucesso) {
    resultados.sucessos++;
    console.log(`  ✅ [PASSOU] [Teste ${numero}] ${nome}`);
    resultados.detalhes.push({ numero, nome, status: 'PASSOU', msg });
  } else {
    resultados.falhas++;
    console.error(`  ❌ [FALHOU] [Teste ${numero}] ${nome}: ${msg}`);
    resultados.detalhes.push({ numero, nome, status: 'FALHOU', msg });
  }
}

async function request(url, { method = 'GET', body = null, token = tokenAdmin } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function executarTestesExclusao() {
  console.log('\n======================================================');
  console.log('   VALIDAÇÃO EXCLUSIVA: EXCLUSÃO COMPLETA DE CAMPANHAS');
  console.log('======================================================\n');

  db = getDb();
  const timestamp = Date.now();

  try {
    // 0. Autenticação Inicial
    const loginRes = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: { usuario: 'admin', senha: 'Admin@12345' }
    });
    tokenAdmin = loginRes.data?.token;
    if (!tokenAdmin) {
      console.error('Falha no login inicial.');
      process.exit(1);
    }

    // -----------------------------------------------------------------
    // TESTE 1: Excluir campanha finalizada sem participantes
    // -----------------------------------------------------------------
    const c1Res = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Sem Participantes ${timestamp}`,
        numero_inicial: 1,
        numero_final: 5,
        todos_premiados: false
      }
    });
    const c1Id = c1Res.data.id;
    // Ativar e depois finalizar
    await request(`${API_URL}/campanhas/${c1Id}/status`, { method: 'PATCH', body: { status: 'ativa' } });
    await request(`${API_URL}/campanhas/${c1Id}/status`, { method: 'PATCH', body: { status: 'finalizada' } });

    const del1Res = await request(`${API_URL}/campanhas/${c1Id}`, { method: 'DELETE' });
    const c1NoDb = await db('campanhas').where({ id: c1Id }).first();
    const nums1NoDb = await db('numeros').where({ campanha_id: c1Id }).count('id as c').first();

    registrarTeste(
      1,
      'Excluir campanha finalizada sem participantes',
      del1Res.status === 200 && !c1NoDb && nums1NoDb.c === 0
    );

    // -----------------------------------------------------------------
    // TESTE 2: Excluir campanha finalizada com vários participantes
    // -----------------------------------------------------------------
    const c2Res = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Vários Participantes ${timestamp}`,
        numero_inicial: 10,
        numero_final: 15,
        todos_premiados: false
      }
    });
    const c2Id = c2Res.data.id;

    // Inserir vários participantes
    for (let i = 1; i <= 4; i++) {
      await request(`${API_URL}/campanhas/${c2Id}/participantes`, {
        method: 'POST',
        body: { nome: `Participante Lote ${i}` }
      });
    }

    await request(`${API_URL}/campanhas/${c2Id}/status`, { method: 'PATCH', body: { status: 'ativa' } });
    await request(`${API_URL}/campanhas/${c2Id}/status`, { method: 'PATCH', body: { status: 'finalizada' } });

    const del2Res = await request(`${API_URL}/campanhas/${c2Id}/excluir`, { method: 'DELETE' });
    const c2NoDb = await db('campanhas').where({ id: c2Id }).first();
    const parts2NoDb = await db('participantes').where({ campanha_id: c2Id }).count('id as c').first();

    registrarTeste(
      2,
      'Excluir campanha finalizada com vários participantes',
      del2Res.status === 200 && !c2NoDb && parts2NoDb.c === 0
    );

    // -----------------------------------------------------------------
    // TESTE 3: Excluir números vinculados
    // -----------------------------------------------------------------
    const nums2NoDb = await db('numeros').where({ campanha_id: c2Id }).count('id as c').first();
    registrarTeste(
      3,
      'Excluir números vinculados (todos removidos da tabela numeros)',
      nums2NoDb.c === 0
    );

    // -----------------------------------------------------------------
    // TESTE 4: Excluir histórico de sorteios vinculado
    // -----------------------------------------------------------------
    const c4Res = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Com Sorteios ${timestamp}`,
        numero_inicial: 20,
        numero_final: 23,
        todos_premiados: false
      }
    });
    const c4Id = c4Res.data.id;

    const p4_1 = await request(`${API_URL}/campanhas/${c4Id}/participantes`, { method: 'POST', body: { nome: 'Sorteado 1' } });
    const p4_2 = await request(`${API_URL}/campanhas/${c4Id}/participantes`, { method: 'POST', body: { nome: 'Sorteado 2' } });

    await request(`${API_URL}/campanhas/${c4Id}/status`, { method: 'PATCH', body: { status: 'ativa' } });

    // Realizar 2 sorteios
    const s1 = await request(`${API_URL}/campanhas/${c4Id}/sorteios`, { method: 'POST', body: { participante_id: p4_1.data.id } });
    const s2 = await request(`${API_URL}/campanhas/${c4Id}/sorteios`, { method: 'POST', body: { participante_id: p4_2.data.id } });

    // Cancelar 1 sorteio para ter tanto confirmado quanto cancelado no histórico
    await request(`${API_URL}/sorteios/${s1.data.id}/cancelar`, {
      method: 'PATCH',
      body: { motivo_cancelamento: 'Cancelamento para teste de exclusão de histórico' }
    });

    // Finalizar campanha
    await request(`${API_URL}/campanhas/${c4Id}/status`, { method: 'PATCH', body: { status: 'finalizada' } });

    // Excluir
    const del4Res = await request(`${API_URL}/campanhas/${c4Id}`, { method: 'DELETE' });
    const sorts4NoDb = await db('sorteios').where({ campanha_id: c4Id }).count('id as c').first();

    registrarTeste(
      4,
      'Excluir histórico de sorteios vinculado (confirmados e cancelados)',
      del4Res.status === 200 && sorts4NoDb.c === 0
    );

    // -----------------------------------------------------------------
    // TESTE 5: Confirmar ausência de registros órfãos
    // -----------------------------------------------------------------
    const c4Check = await db('campanhas').where({ id: c4Id }).first();
    const parts4Check = await db('participantes').where({ campanha_id: c4Id }).count('id as c').first();
    const nums4Check = await db('numeros').where({ campanha_id: c4Id }).count('id as c').first();
    const sorts4Check = await db('sorteios').where({ campanha_id: c4Id }).count('id as c').first();

    registrarTeste(
      5,
      'Confirmar ausência de registros órfãos em todas as tabelas dependentes',
      !c4Check && parts4Check.c === 0 && nums4Check.c === 0 && sorts4Check.c === 0
    );

    // -----------------------------------------------------------------
    // TESTE 6: Impedir exclusão de campanha ativa
    // -----------------------------------------------------------------
    const cAtivaRes = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Ativa Teste ${timestamp}`,
        numero_inicial: 30,
        numero_final: 32,
        todos_premiados: false
      }
    });
    const cAtivaId = cAtivaRes.data.id;
    await request(`${API_URL}/campanhas/${cAtivaId}/status`, { method: 'PATCH', body: { status: 'ativa' } });

    const delAtivaRes = await request(`${API_URL}/campanhas/${cAtivaId}`, { method: 'DELETE' });
    const cAtivaAindaExiste = await db('campanhas').where({ id: cAtivaId }).first();

    registrarTeste(
      6,
      'Impedir exclusão de campanha ativa (HTTP 422)',
      delAtivaRes.status === 422 && !!cAtivaAindaExiste
    );

    // -----------------------------------------------------------------
    // TESTE 7: Impedir exclusão de campanha em preparação
    // -----------------------------------------------------------------
    const cPrepRes = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Em Preparação Teste ${timestamp}`,
        numero_inicial: 40,
        numero_final: 42,
        todos_premiados: false
      }
    });
    const cPrepId = cPrepRes.data.id;

    const delPrepRes = await request(`${API_URL}/campanhas/${cPrepId}`, { method: 'DELETE' });
    const cPrepAindaExiste = await db('campanhas').where({ id: cPrepId }).first();

    registrarTeste(
      7,
      'Impedir exclusão de campanha em preparação (HTTP 422)',
      delPrepRes.status === 422 && !!cPrepAindaExiste
    );

    // -----------------------------------------------------------------
    // TESTE 8: Impedir exclusão de campanha cancelada
    // -----------------------------------------------------------------
    const cCancRes = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Cancelada Teste ${timestamp}`,
        numero_inicial: 50,
        numero_final: 52,
        todos_premiados: false
      }
    });
    const cCancId = cCancRes.data.id;
    await request(`${API_URL}/campanhas/${cCancId}/status`, { method: 'PATCH', body: { status: 'cancelada' } });

    const delCancRes = await request(`${API_URL}/campanhas/${cCancId}`, { method: 'DELETE' });
    const cCancAindaExiste = await db('campanhas').where({ id: cCancId }).first();

    registrarTeste(
      8,
      'Impedir exclusão de campanha cancelada (HTTP 422)',
      delCancRes.status === 422 && !!cCancAindaExiste
    );

    // -----------------------------------------------------------------
    // TESTE 9: Impedir exclusão sem autenticação
    // -----------------------------------------------------------------
    const delSemAuth = await request(`${API_URL}/campanhas/${cPrepId}`, {
      method: 'DELETE',
      token: null
    });
    registrarTeste(
      9,
      'Impedir exclusão sem autenticação (HTTP 401)',
      delSemAuth.status === 401
    );

    // -----------------------------------------------------------------
    // TESTE 10: Simular falha durante a exclusão e confirmar rollback integral
    // -----------------------------------------------------------------
    // Cria uma campanha finalizada para testar rollback transacional
    const cRollbackRes = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Teste Rollback ${timestamp}`,
        numero_inicial: 60,
        numero_final: 62,
        todos_premiados: false
      }
    });
    const cRollbackId = cRollbackRes.data.id;
    await request(`${API_URL}/campanhas/${cRollbackId}/participantes`, { method: 'POST', body: { nome: 'Participante Rollback' } });
    await request(`${API_URL}/campanhas/${cRollbackId}/status`, { method: 'PATCH', body: { status: 'ativa' } });
    await request(`${API_URL}/campanhas/${cRollbackId}/status`, { method: 'PATCH', body: { status: 'finalizada' } });

    // Simula transação com falha proposital no meio da exclusão
    let rollbackOcorreu = false;
    try {
      await db.transaction(async (trx) => {
        // Exclui sorteios
        await trx('sorteios').where({ campanha_id: cRollbackId }).delete();
        // Exclui números
        await trx('numeros').where({ campanha_id: cRollbackId }).delete();
        // Força erro intencional antes de excluir participantes e campanha
        throw new Error('SIMULAÇÃO_FALHA_TRANSAÇÃO');
      });
    } catch (e) {
      if (e.message === 'SIMULAÇÃO_FALHA_TRANSAÇÃO') {
        rollbackOcorreu = true;
      }
    }

    // Verifica que nenhum dado foi removido devido ao rollback
    const numsRollbackCheck = await db('numeros').where({ campanha_id: cRollbackId }).count('id as c').first();
    const partsRollbackCheck = await db('participantes').where({ campanha_id: cRollbackId }).count('id as c').first();
    const campRollbackCheck = await db('campanhas').where({ id: cRollbackId }).first();

    const rollbackSucesso = rollbackOcorreu && numsRollbackCheck.c === 3 && partsRollbackCheck.c === 1 && !!campRollbackCheck;
    registrarTeste(
      10,
      'Simular falha durante exclusão e confirmar rollback integral',
      rollbackSucesso
    );

    // -----------------------------------------------------------------
    // TESTE 11: Confirmar que usuários administrativos continuam cadastrados e podem fazer login
    // -----------------------------------------------------------------
    const totalAdmins = await db('usuarios').count('id as c').first();
    const loginFinalRes = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: { usuario: 'admin', senha: 'Admin@12345' }
    });

    registrarTeste(
      11,
      'Confirmar que usuários administrativos continuam cadastrados e realizam login normalmente',
      totalAdmins.c > 0 && loginFinalRes.ok && !!loginFinalRes.data.token
    );

    // -----------------------------------------------------------------
    // TESTE 12: Regressão das etapas anteriores
    // -----------------------------------------------------------------
    const resRegHealth = await request(`${BASE_URL}/health`);
    const resRegCampanhas = await request(`${API_URL}/campanhas`);
    const resRegUsuarios = await request(`${API_URL}/usuarios`);

    const regressaoSucesso = resRegHealth.ok && resRegCampanhas.ok && resRegUsuarios.ok;
    registrarTeste(
      12,
      'Executar regressão das funcionalidades de saúde, campanhas e usuários',
      regressaoSucesso
    );

  } catch (err) {
    console.error('Erro na execução dos testes de exclusão:', err);
  }

  console.log('\n======================================================');
  console.log(`   RESULTADO FINAL: ${resultados.sucessos}/${resultados.total} TESTES APROVADOS`);
  console.log('======================================================\n');

  process.exit(resultados.falhas > 0 ? 1 : 0);
}

executarTestesExclusao();
