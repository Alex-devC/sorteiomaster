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

function registrarTeste(nome, sucesso, msg = '') {
  resultados.total++;
  if (sucesso) {
    resultados.sucessos++;
    console.log(`  ✅ [PASSOU] ${nome}`);
    resultados.detalhes.push({ nome, status: 'PASSOU', msg });
  } else {
    resultados.falhas++;
    console.error(`  ❌ [FALHOU] ${nome}: ${msg}`);
    resultados.detalhes.push({ nome, status: 'FALHOU', msg });
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

async function executarTestes() {
  console.log('\n======================================================');
  console.log('   INICIANDO BATERIA DE TESTES — ETAPA 10');
  console.log('======================================================\n');

  db = getDb();

  try {
    // 0. Login com admin
    console.log('--- 0. AUTENTICAÇÃO INICIAL ---');
    const loginRes = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: { usuario: 'admin', senha: 'Admin@12345' }
    });
    tokenAdmin = loginRes.data?.token;
    registrarTeste('Login como admin principal', loginRes.ok && !!tokenAdmin);

    // ==========================================================
    // 1. TESTES DE USUÁRIOS
    // ==========================================================
    console.log('\n--- 1. TESTES DE USUÁRIOS ---');
    const timestamp = Date.now();
    const novoUsuarioLogin = `user_t10_${timestamp}`;
    let novoUsuarioId = null;

    // 1.1 Cadastro de novo usuário
    const resCad = await request(`${API_URL}/usuarios`, {
      method: 'POST',
      body: {
        nome: 'Operador Teste Etapa 10',
        usuario: novoUsuarioLogin,
        senha: 'SenhaForte123!',
        ativo: true
      }
    });
    novoUsuarioId = resCad.data?.id;
    registrarTeste('Cadastrar novo usuário', resCad.status === 201 && novoUsuarioId > 0);

    // 1.2 Login com o novo usuário
    const resLoginNovo = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: { usuario: novoUsuarioLogin, senha: 'SenhaForte123!' }
    });
    registrarTeste('Login com novo usuário cadastrado', resLoginNovo.ok && !!resLoginNovo.data?.token);

    // 1.3 Impedir duplicidade de nome de usuário
    const resDup = await request(`${API_URL}/usuarios`, {
      method: 'POST',
      body: {
        nome: 'Duplicado',
        usuario: novoUsuarioLogin,
        senha: 'SenhaForte123!'
      }
    });
    registrarTeste('Impedir duplicidade de nome de usuário', resDup.status === 409);

    // 1.4 Edição de usuário
    const resEdit = await request(`${API_URL}/usuarios/${novoUsuarioId}`, {
      method: 'PUT',
      body: { nome: 'Operador Teste Renomeado' }
    });
    registrarTeste('Edição de dados do usuário', resEdit.status === 200 && resEdit.data?.nome === 'Operador Teste Renomeado');

    // 1.5 Alteração de senha
    const resSenha = await request(`${API_URL}/usuarios/${novoUsuarioId}/senha`, {
      method: 'PATCH',
      body: { nova_senha: 'NovaSenhaSegura456!' }
    });

    const resLoginNovaSenha = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: { usuario: novoUsuarioLogin, senha: 'NovaSenhaSegura456!' }
    });
    registrarTeste('Alteração de senha e login com nova credencial', resSenha.status === 200 && resLoginNovaSenha.ok);

    // 1.6 Desativação de usuário
    const resDesat = await request(`${API_URL}/usuarios/${novoUsuarioId}/status`, {
      method: 'PATCH',
      body: { ativo: false }
    });
    registrarTeste('Desativação de usuário', resDesat.status === 200 && (resDesat.data?.ativo === 0 || resDesat.data?.ativo === false));

    // 1.7 Bloqueio de login de usuário desativado
    const resLoginBloq = await request(`${AUTH_URL}/login`, {
      method: 'POST',
      body: { usuario: novoUsuarioLogin, senha: 'NovaSenhaSegura456!' }
    });
    registrarTeste('Bloqueio de login de usuário desativado (403)', resLoginBloq.status === 403);

    // 1.8 Reativação de usuário
    const resAtiv = await request(`${API_URL}/usuarios/${novoUsuarioId}/status`, {
      method: 'PATCH',
      body: { ativo: true }
    });
    registrarTeste('Reativação de usuário', resAtiv.status === 200 && (resAtiv.data?.ativo === 1 || resAtiv.data?.ativo === true));

    // 1.9 Proteção da conta do administrador principal contra desativação
    const resProtAdmin = await request(`${API_URL}/usuarios/1/status`, {
      method: 'PATCH',
      body: { ativo: false }
    });
    registrarTeste('Proteção da conta do administrador principal contra desativação (422)', resProtAdmin.status === 422);

    // 1.10 Impedir auto-desativação do próprio administrador autenticado
    const resAutoDesat = await request(`${API_URL}/usuarios/1/status`, {
      method: 'PATCH',
      body: { ativo: false }
    });
    registrarTeste('Impedir auto-desativação do próprio administrador (422)', resAutoDesat.status === 422);

    // ==========================================================
    // 2. TESTES DE EXCLUSÃO DE CAMPANHAS FINALIZADAS
    // ==========================================================
    console.log('\n--- 2. TESTES DE EXCLUSÃO DE CAMPANHAS FINALIZADAS ---');

    // 2.1 Criar campanha para teste de exclusão
    const resCampExcluir = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Para Excluir ${timestamp}`,
        numero_inicial: 10,
        numero_final: 12,
        todos_premiados: false
      }
    });
    const campExcluirId = resCampExcluir.data.id;

    // Adicionar participantes
    const pExcl1 = await request(`${API_URL}/campanhas/${campExcluirId}/participantes`, { method: 'POST', body: { nome: 'Part Excluir 1' } });
    await request(`${API_URL}/campanhas/${campExcluirId}/participantes`, { method: 'POST', body: { nome: 'Part Excluir 2' } });

    // 2.2 Tentar excluir em preparação -> DEVE FALHAR (422)
    const resExclPrep = await request(`${API_URL}/campanhas/${campExcluirId}/excluir`, { method: 'DELETE' });
    registrarTeste('Impedir exclusão de campanha em_preparacao (422)', resExclPrep.status === 422);

    // Ativar campanha
    await request(`${API_URL}/campanhas/${campExcluirId}/status`, { method: 'PATCH', body: { status: 'ativa' } });

    // 2.3 Tentar excluir ativa -> DEVE FALHAR (422)
    const resExclAtiva = await request(`${API_URL}/campanhas/${campExcluirId}/excluir`, { method: 'DELETE' });
    registrarTeste('Impedir exclusão de campanha ativa (422)', resExclAtiva.status === 422);

    // Realizar um sorteio na campanha
    await request(`${API_URL}/campanhas/${campExcluirId}/sorteios`, { method: 'POST', body: { participante_id: pExcl1.data.id } });

    // Finalizar campanha
    await request(`${API_URL}/campanhas/${campExcluirId}/status`, { method: 'PATCH', body: { status: 'finalizada' } });

    // 2.4 Excluir campanha finalizada -> DEVE PASSAR (200)
    const resExcl = await request(`${API_URL}/campanhas/${campExcluirId}/excluir`, { method: 'DELETE' });
    registrarTeste('Exclusão bem-sucedida de campanha finalizada (200)', resExcl.status === 200);

    // 2.5 Validar integridade no banco: campanha, participantes, números e histórico foram deletados
    const campDepois = await db('campanhas').where({ id: campExcluirId }).first();
    const partsDepois = await db('participantes').where({ campanha_id: campExcluirId }).count('id as c').first();
    const numsDepois = await db('numeros').where({ campanha_id: campExcluirId }).count('id as c').first();
    const sortsDepois = await db('sorteios').where({ campanha_id: campExcluirId }).count('id as c').first();

    registrarTeste(
      'Limpeza completa e sem orfandade (Campanha, Participantes, Números, Histórico)',
      !campDepois && partsDepois.c === 0 && numsDepois.c === 0 && sortsDepois.c === 0
    );

    // ==========================================================
    // 3. TESTES DE REATIVAÇÃO DE CAMPANHAS FINALIZADAS
    // ==========================================================
    console.log('\n--- 3. TESTES DE REATIVAÇÃO DE CAMPANHAS FINALIZADAS ---');

    // 3.1 Criar campanha para teste da OPÇÃO A (Zerar)
    const resCampA = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Reativação Zerar ${timestamp}`,
        numero_inicial: 50,
        numero_final: 52,
        todos_premiados: false
      }
    });
    const campAId = resCampA.data.id;

    const pA1 = await request(`${API_URL}/campanhas/${campAId}/participantes`, { method: 'POST', body: { nome: 'Carlos Silva' } });
    await request(`${API_URL}/campanhas/${campAId}/participantes`, { method: 'POST', body: { nome: 'Mariana Costa' } });
    await request(`${API_URL}/campanhas/${campAId}/status`, { method: 'PATCH', body: { status: 'ativa' } });

    // Realizar 1 sorteio
    await request(`${API_URL}/campanhas/${campAId}/sorteios`, { method: 'POST', body: { participante_id: pA1.data.id } });

    // Finalizar
    await request(`${API_URL}/campanhas/${campAId}/status`, { method: 'PATCH', body: { status: 'finalizada' } });

    // 3.2 Tentar reativar com opção inválida (400)
    const resReatInvalida = await request(`${API_URL}/campanhas/${campAId}/reativar`, { method: 'POST', body: { opcao: 'invalida' } });
    registrarTeste('Rejeitar opção de reativação inválida (400)', resReatInvalida.status === 400);

    // 3.3 Reativar com OPÇÃO A (zerar)
    const resReatA = await request(`${API_URL}/campanhas/${campAId}/reativar`, { method: 'POST', body: { opcao: 'zerar' } });
    registrarTeste('Reativar campanha com OPÇÃO A (zerar) -> status ativa', resReatA.status === 200 && resReatA.data?.status === 'ativa');

    // 3.4 Validar efeitos da OPÇÃO A:
    const sorteiosA = await db('sorteios').where({ campanha_id: campAId });
    const todosCancelados = sorteiosA.every(s => s.status === 'cancelado' && s.motivo_cancelamento.includes('Campanha reiniciada'));
    const partsA = await db('participantes').where({ campanha_id: campAId });
    const todosPartsDisponiveis = partsA.every(p => p.status === 'disponivel');
    const numsA = await db('numeros').where({ campanha_id: campAId });
    const todosNumsDisponiveis = numsA.every(n => n.status === 'disponivel');

    registrarTeste(
      'OPÇÃO A: Histórico preservado com status cancelado e motivo de reinício',
      sorteiosA.length > 0 && todosCancelados
    );
    registrarTeste(
      'OPÇÃO A: Todos os participantes liberados para novo sorteio',
      todosPartsDisponiveis
    );
    registrarTeste(
      'OPÇÃO A: Todos os números liberados para novo sorteio',
      todosNumsDisponiveis
    );

    // 3.5 Impedir reativação duplicada (campanha já está ativa)
    const resReatDuplicada = await request(`${API_URL}/campanhas/${campAId}/reativar`, { method: 'POST', body: { opcao: 'zerar' } });
    registrarTeste('Impedir reativação de campanha que já está ativa (422)', resReatDuplicada.status === 422);

    // 3.6 Criar campanha para teste da OPÇÃO B (Continuar de onde parou)
    const resCampB = await request(`${API_URL}/campanhas`, {
      method: 'POST',
      body: {
        nome: `Campanha Reativação Continuar ${timestamp}`,
        numero_inicial: 80,
        numero_final: 82,
        todos_premiados: false
      }
    });
    const campBId = resCampB.data.id;

    const pB1 = await request(`${API_URL}/campanhas/${campBId}/participantes`, { method: 'POST', body: { nome: 'Beatriz Lima' } });
    await request(`${API_URL}/campanhas/${campBId}/participantes`, { method: 'POST', body: { nome: 'Rodrigo Alves' } });
    await request(`${API_URL}/campanhas/${campBId}/status`, { method: 'PATCH', body: { status: 'ativa' } });

    // Realizar 1 sorteio
    const resSortB = await request(`${API_URL}/campanhas/${campBId}/sorteios`, { method: 'POST', body: { participante_id: pB1.data.id } });
    const sorteioBId = resSortB.data.id;

    // Finalizar
    await request(`${API_URL}/campanhas/${campBId}/status`, { method: 'PATCH', body: { status: 'finalizada' } });

    // 3.7 Reativar com OPÇÃO B (continuar)
    const resReatB = await request(`${API_URL}/campanhas/${campBId}/reativar`, { method: 'POST', body: { opcao: 'continuar' } });
    registrarTeste('Reativar campanha com OPÇÃO B (continuar) -> status ativa', resReatB.status === 200 && resReatB.data?.status === 'ativa');

    // 3.8 Validar efeitos da OPÇÃO B:
    const sorteioBCheck = await db('sorteios').where({ id: sorteioBId }).first();
    const partBCheck = await db('participantes').where({ id: sorteioBCheck.participante_id }).first();
    const numBCheck = await db('numeros').where({ id: sorteioBCheck.numero_id }).first();

    registrarTeste(
      'OPÇÃO B: Sorteios confirmados preservados sem alteração',
      sorteioBCheck.status === 'confirmado'
    );
    registrarTeste(
      'OPÇÃO B: Participante contemplado continua bloqueado (sorteado)',
      partBCheck.status === 'sorteado'
    );
    registrarTeste(
      'OPÇÃO B: Número sorteado continua bloqueado (sorteado)',
      numBCheck.status === 'sorteado'
    );

    // ==========================================================
    // 4. TESTES DE REGRESSÃO DAS ETAPAS ANTERIORES
    // ==========================================================
    console.log('\n--- 4. TESTES DE REGRESSÃO ---');

    // 4.1 Conferência de campanha
    const resConf = await request(`${API_URL}/campanhas/${campBId}/conferencia`);
    registrarTeste('Regressão: Endpoint de conferência de campanha', resConf.status === 200 && resConf.data?.campanha_id === campBId);

    // 4.2 Listagem de participantes
    const resParts = await request(`${API_URL}/campanhas/${campBId}/participantes`);
    registrarTeste('Regressão: Listagem de participantes da campanha', resParts.status === 200 && Array.isArray(resParts.data));

    // 4.3 Estatísticas de números
    const resNumStats = await request(`${API_URL}/campanhas/${campBId}/numeros/stats`);
    registrarTeste('Regressão: Estatísticas de números da campanha', resNumStats.status === 200 && resNumStats.data?.total === 3);

    // 4.4 Histórico de sorteios
    const resHist = await request(`${API_URL}/campanhas/${campBId}/sorteios`);
    registrarTeste('Regressão: Histórico de sorteios da campanha', resHist.status === 200 && Array.isArray(resHist.data));

    // 4.5 Exportação CSV
    const resExpCsv = await request(`${API_URL}/campanhas/${campBId}/exportar/csv`);
    registrarTeste('Regressão: Exportação CSV de resultados', resExpCsv.status === 200 && typeof resExpCsv.data === 'string');

  } catch (err) {
    console.error('Erro crítico na bateria de testes:', err);
  }

  console.log('\n======================================================');
  console.log(`   RESULTADO FINAL: ${resultados.sucessos}/${resultados.total} TESTES APROVADOS`);
  console.log('======================================================\n');

  process.exit(resultados.falhas > 0 ? 1 : 0);
}

executarTestes();
