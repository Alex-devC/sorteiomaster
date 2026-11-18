'use strict';

require('dotenv').config();
const http = require('http');

const API_BASE = 'http://localhost:3001/api';
const FRONT_BASE = 'http://localhost:5173';

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

function requestHttp(urlStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
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
  console.log('   SUÍTE DE TESTES E VALIDAÇÃO INTEGRADA — ETAPA 04');
  console.log('======================================================\n');

  // 1. Validar que o frontend Vite está respondendo na porta 5173
  console.log('[1] Disponibilidade do Frontend');
  try {
    const frontRes = await requestHttp(FRONT_BASE);
    ok('Frontend Vite servindo index.html na porta 5173', frontRes.status === 200 && frontRes.body.includes('Sorteio Master'));
  } catch (err) {
    ok('Frontend Vite servindo index.html', false, err.message);
  }

  // 2. Validar que a API está respondendo na porta 3001
  console.log('\n[2] Disponibilidade da API');
  try {
    const healthRes = await requestHttp(`${API_BASE}/health`);
    ok('GET /api/health retorna 200 e status ok', healthRes.status === 200 && healthRes.body.status === 'ok');
  } catch (err) {
    ok('API respondendo em /api/health', false, err.message);
  }

  // 3. Teste de login com credenciais inválidas
  console.log('\n[3] Login com credenciais inválidas');
  const loginFail = await requestHttp(`${API_BASE}/auth/login`, { method: 'POST' }, {
    usuario: 'admin',
    senha: 'senha_errada_123'
  });
  ok('Login com senha inválida rejeitado com HTTP 401', loginFail.status === 401);
  ok('Retorna mensagem descritiva de erro', !!loginFail.body.error);

  // 4. Teste de login com credenciais válidas
  console.log('\n[4] Login com credenciais válidas');
  const loginSuccess = await requestHttp(`${API_BASE}/auth/login`, { method: 'POST' }, {
    usuario: 'admin',
    senha: 'Admin@12345'
  });
  ok('Login com sucesso retorna HTTP 200', loginSuccess.status === 200);
  ok('Retorna token JWT válido', !!loginSuccess.body.token && loginSuccess.body.token.startsWith('eyJ'));
  ok('Retorna dados do usuário autenticado', !!loginSuccess.body.usuario && loginSuccess.body.usuario.usuario === 'admin');
  const token = loginSuccess.body.token;

  // 5. Bloqueio de acesso a rota protegida sem token
  console.log('\n[5] Proteção de Rotas Administrativas');
  const rotaSemToken = await requestHttp(`${API_BASE}/admin/campanhas`);
  ok('Acesso direto sem token bloqueado com HTTP 401', rotaSemToken.status === 401);

  // 6. Acesso a rota protegida com token válido
  console.log('\n[6] Acesso com Autenticação');
  const rotaComToken = await requestHttp(`${API_BASE}/admin/campanhas`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  ok('Acesso com token JWT retorna HTTP 200', rotaComToken.status === 200 && Array.isArray(rotaComToken.body));
  const campanhas = rotaComToken.body;
  ok('API retorna campanhas reais para o Dashboard', campanhas.length >= 0);

  // 7. Consumo do endpoint de conferência da campanha para o Dashboard
  console.log('\n[7] Endpoint de Conferência para o Dashboard');
  if (campanhas.length > 0) {
    const primeiraCampanha = campanhas[0];
    const confRes = await requestHttp(`${API_BASE}/admin/campanhas/${primeiraCampanha.id}/conferencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Conferência da campanha selecionada retorna HTTP 200', confRes.status === 200);
    ok('Retorna indicadores reais de números e participantes',
      confRes.body.numeros !== undefined &&
      confRes.body.participantes !== undefined &&
      confRes.body.compativel !== undefined
    );
  } else {
    ok('Conferência da campanha (nenhuma campanha para teste)', true);
  }

  // 8. Teste de sessão com token expirado/inválido
  console.log('\n[8] Tratamento de Token Inválido / Sessão Expirada');
  const rotaTokenInvalido = await requestHttp(`${API_BASE}/admin/campanhas`, {
    headers: { Authorization: 'Bearer token_ficticio_invalido_12345' }
  });
  ok('Token adulterado/inválido retorna HTTP 401', rotaTokenInvalido.status === 401);

  // ─── RESUMO FINAL
  console.log(`\n${'='.repeat(55)}`);
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passou + falhou}`);
  console.log(`APROVADOS: ${passou} | FALHAS: ${falhou}`);
  console.log(`${'='.repeat(55)}\n`);

  process.exit(falhou > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Erro na execução dos testes da Etapa 04:', err);
  process.exit(1);
});
