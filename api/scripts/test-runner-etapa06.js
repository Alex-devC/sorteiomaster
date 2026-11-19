'use strict';

require('dotenv').config();
const http = require('http');
const xlsx = require('xlsx');
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

function uploadMultipart(path, fieldName, filename, fileBuffer, fields = {}, token = null) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    let postData = '';

    for (const [k, v] of Object.entries(fields)) {
      postData += `--${boundary}\r\n`;
      postData += `Content-Disposition: form-data; name="${k}"\r\n\r\n`;
      postData += `${v}\r\n`;
    }

    postData += `--${boundary}\r\n`;
    postData += `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n`;
    postData += `Content-Type: application/octet-stream\r\n\r\n`;

    const headBuf = Buffer.from(postData, 'utf8');
    const tailBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const fullBody = Buffer.concat([headBuf, fileBuffer, tailBuf]);

    const reqOptions = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api' + path,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
      }
    };

    if (token) {
      reqOptions.headers['Authorization'] = `Bearer ${token}`;
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
    req.write(fullBody);
    req.end();
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('   SUÍTE DE TESTES E VALIDAÇÃO DE PARTICIPANTES — ETAPA 06');
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

  let testCampId = null;
  let testPartId = null;
  let partSorteadoId = null;

  try {
    // 1. Autenticação Administrativa
    console.log('[1] Autenticação Administrativa (Login)');
    const loginRes = await requestHttp('/auth/login', { method: 'POST' }, {
      usuario: 'admin',
      senha: 'Admin@12345'
    });
    ok('Login administrativo retorna token JWT válido', loginRes.status === 200 && !!loginRes.body.token);
    const token = loginRes.body.token;

    // 2. Proteção de Rotas (Tratamento de HTTP 401)
    console.log('\n[2] Proteção de Rotas e Tratamento de 401');
    const noAuthRes = await requestHttp('/admin/campanhas/1/participantes');
    ok('Acesso a participantes sem token bloqueado com 401', noAuthRes.status === 401);

    // 3. Preparação: Criar campanha para os testes
    console.log('\n[3] Preparação do Ambiente de Teste');
    const campRes = await requestHttp('/admin/campanhas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: `Campanha Teste Participantes ${Date.now()}`,
      numero_inicial: 100,
      numero_final: 120,
      todos_premiados: true
    });
    ok('Campanha de teste criada com sucesso (201)', campRes.status === 201 && !!campRes.body.id);
    testCampId = campRes.body.id;

    // 4. Listagem inicial vazia
    console.log('\n[4] Listagem Inicial de Participantes');
    const listVazia = await requestHttp(`/admin/campanhas/${testCampId}/participantes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Listagem inicial retorna array vazio (200)', listVazia.status === 200 && Array.isArray(listVazia.body) && listVazia.body.length === 0);

    // 5. Validação de Cadastro Inválido
    console.log('\n[5] Validação de Cadastro Inválido');
    const partInvalido = await requestHttp(`/admin/campanhas/${testCampId}/participantes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: '   '
    });
    ok('Cadastro com nome em branco rejeitado com HTTP 400', partInvalido.status === 400);

    // 6. Cadastro Válido
    console.log('\n[6] Cadastro Válido de Participante');
    const partValido = await requestHttp(`/admin/campanhas/${testCampId}/participantes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: 'Carlos Eduardo Mendes'
    });
    ok('Cadastro de participante retorna HTTP 201', partValido.status === 201 && !!partValido.body.id);
    ok('Participante salvo com status disponivel', partValido.body.status === 'disponivel');
    ok('Nome e nome_normalizado gravados corretamente', partValido.body.nome === 'Carlos Eduardo Mendes' && partValido.body.nome_normalizado === 'carlos eduardo mendes');
    testPartId = partValido.body.id;

    // 7. Tratamento de Duplicidade (Case e Espaços)
    console.log('\n[7] Tratamento de Duplicidade e Normalização');
    const partDuplicado = await requestHttp(`/admin/campanhas/${testCampId}/participantes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: '  carlos   eduardo   mendes  '
    });
    ok('Tentativa de cadastro com duplicidade normalizada rejeitada com HTTP 409', partDuplicado.status === 409);

    // 8. Edição de Participante Disponível
    console.log('\n[8] Edição de Participante Disponível');
    const editRes = await requestHttp(`/admin/participantes/${testPartId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: 'Carlos Eduardo M. Silva'
    });
    ok('Edição de nome de participante retorna HTTP 200', editRes.status === 200);
    ok('Nome atualizado refletido na resposta', editRes.body.nome === 'Carlos Eduardo M. Silva');

    // 9. Pesquisa por Nome (query param `busca`)
    console.log('\n[9] Pesquisa por Nome (busca parcial)');
    // Cadastrar segundo participante para teste de pesquisa
    await requestHttp(`/admin/campanhas/${testCampId}/participantes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: 'Mariana Ferreira'
    });

    const buscaCarlos = await requestHttp(`/admin/campanhas/${testCampId}/participantes?busca=carlos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Busca por "carlos" retorna apenas Carlos', buscaCarlos.status === 200 && buscaCarlos.body.length === 1 && buscaCarlos.body[0].nome.includes('Carlos'));

    const buscaMariana = await requestHttp(`/admin/campanhas/${testCampId}/participantes?busca=mariana`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Busca por "mariana" retorna apenas Mariana', buscaMariana.status === 200 && buscaMariana.body.length === 1 && buscaMariana.body[0].nome.includes('Mariana'));

    // 10. Filtro por Situação (query param `status`)
    console.log('\n[10] Filtro por Situação (status)');
    const filtroDisp = await requestHttp(`/admin/campanhas/${testCampId}/participantes?status=disponivel`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Filtro por status=disponivel retorna participantes disponíveis', filtroDisp.status === 200 && filtroDisp.body.length === 2);

    const filtroSorteadoVazio = await requestHttp(`/admin/campanhas/${testCampId}/participantes?status=sorteado`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Filtro por status=sorteado retorna vazio antes do sorteio', filtroSorteadoVazio.status === 200 && filtroSorteadoVazio.body.length === 0);

    // 11. Conferência da Campanha
    console.log('\n[11] Consulta de Conferência da Campanha');
    const confRes = await requestHttp(`/admin/campanhas/${testCampId}/conferencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Endpoint de conferência retorna HTTP 200', confRes.status === 200);
    ok('Total de participantes confere (2 participantes cadastrados)', confRes.body.participantes.total === 2);
    ok('Total de números confere (21 números: 100 a 120)', confRes.body.numeros.total === 21);
    ok('Configuração compatível para todos_premiados', confRes.body.compativel === true);

    // 12. Seleção e Prévia de Arquivo Excel (XLSX)
    console.log('\n[12] Importação: Pré-visualização de Arquivo XLSX');
    const wbXlsx = xlsx.utils.book_new();
    const wsDataXlsx = [
      ['Nome Completo', 'Observação'],
      ['Juliana Andrade', 'Colaboradora'],
      ['Roberto Antunes', 'Cliente'],
      ['', 'Vazio'],
      ['Juliana Andrade', 'Duplicado no arquivo'],
      ['Carlos Eduardo M. Silva', 'Já cadastrado na campanha']
    ];
    const wsXlsx = xlsx.utils.aoa_to_sheet(wsDataXlsx);
    xlsx.utils.book_append_sheet(wbXlsx, wsXlsx, 'Planilha1');
    const xlsxBuf = xlsx.write(wbXlsx, { type: 'buffer', bookType: 'xlsx' });

    const prevXlsx = await uploadMultipart(
      `/admin/campanhas/${testCampId}/importar/preview`,
      'arquivo',
      'participantes_teste.xlsx',
      xlsxBuf,
      { coluna: 'Nome Completo' },
      token
    );
    ok('Preview XLSX retorna HTTP 200', prevXlsx.status === 200);
    ok('Detecta corretamente as colunas da planilha', Array.isArray(prevXlsx.body.colunas) && prevXlsx.body.colunas.length === 2);
    ok('Diagnóstico de linhas: 2 válidos, 1 vazio, 1 duplicado, 1 já cadastrado',
      prevXlsx.body.resumo.validos === 2 &&
      prevXlsx.body.resumo.vazios === 1 &&
      prevXlsx.body.resumo.duplicados_no_arquivo === 1 &&
      prevXlsx.body.resumo.ja_cadastrados_na_campanha === 1
    );
    ok('Array nomes_validos retornado integralmente para confirmação',
      Array.isArray(prevXlsx.body.nomes_validos) && prevXlsx.body.nomes_validos.length === 2
    );

    // 13. Seleção e Prévia de Arquivo CSV
    console.log('\n[13] Importação: Pré-visualização de Arquivo CSV');
    const csvContent = 'Nome;Departamento\r\nPatricia Alencar;TI\r\nMarcos Viana;Financeiro\r\n';
    const csvBuf = Buffer.from(csvContent, 'utf8');

    const prevCsv = await uploadMultipart(
      `/admin/campanhas/${testCampId}/importar/preview`,
      'arquivo',
      'equipe_teste.csv',
      csvBuf,
      { coluna: '0' },
      token
    );
    ok('Preview CSV retorna HTTP 200', prevCsv.status === 200);
    ok('Identifica 2 válidos no arquivo CSV', prevCsv.body.resumo.validos === 2);

    // 14. Confirmação de Importação
    console.log('\n[14] Confirmação da Importação e Persistência');
    const confImp = await requestHttp(`/admin/campanhas/${testCampId}/importar/confirmar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nomes: prevXlsx.body.nomes_validos
    });
    ok('Confirmação retorna HTTP 200', confImp.status === 200);
    ok('Efetivamente importou os 2 registros válidos', confImp.body.total_efetivamente_importado === 2);

    // 15. Atualização da Listagem e Conferência pós-importação
    console.log('\n[15] Atualização de Listagem e Conferência pós-importação');
    const listPosImp = await requestHttp(`/admin/campanhas/${testCampId}/participantes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Listagem atualizada reflete 4 participantes cadastrados', listPosImp.status === 200 && listPosImp.body.length === 4);

    const confPosImp = await requestHttp(`/admin/campanhas/${testCampId}/conferencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Conferência atualizada reflete 4 participantes disponíveis', confPosImp.body.participantes.total === 4 && confPosImp.body.participantes.disponiveis === 4);

    // 16. Exclusão de Participante Disponível
    console.log('\n[16] Exclusão de Participante Disponível');
    // Pegar um participante para excluir (ex: Mariana Ferreira)
    const partMariana = listPosImp.body.find(p => p.nome.includes('Mariana'));
    const delRes = await requestHttp(`/admin/participantes/${partMariana.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Exclusão de participante disponível retorna HTTP 200', delRes.status === 200);

    const listPosDel = await requestHttp(`/admin/campanhas/${testCampId}/participantes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Participante removido com sucesso da listagem (total = 3)', listPosDel.body.length === 3);

    // 17. Sorteio e Bloqueio de Exclusão/Edição de Participante Sorteado
    console.log('\n[17] Regra de Proteção: Bloqueio para Participante Sorteado');
    // Ativar a campanha para poder realizar sorteio
    await requestHttp(`/admin/campanhas/${testCampId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      status: 'ativa'
    });

    // Realizar 1 sorteio na campanha escolhendo o participante disponível testPartId
    const sorteioRes = await requestHttp(`/admin/campanhas/${testCampId}/sorteios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      participante_id: testPartId
    });
    ok('Sorteio realizado na campanha (201)', sorteioRes.status === 201 && !!sorteioRes.body.id);
    partSorteadoId = sorteioRes.body.participante_id;

    // Tentar editar o participante sorteado -> deve retornar 422
    const editSorteado = await requestHttp(`/admin/participantes/${partSorteadoId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    }, {
      nome: 'Nome Tentativa Alteracao'
    });
    ok('Bloqueia edição de participante contemplado com HTTP 422', editSorteado.status === 422);

    // Tentar excluir o participante sorteado -> deve retornar 422
    const delSorteado = await requestHttp(`/admin/participantes/${partSorteadoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Bloqueia exclusão de participante contemplado com HTTP 422', delSorteado.status === 422);

    // 18. Filtro por Situação pós-sorteio
    console.log('\n[18] Filtro por Situação pós-sorteio');
    const filtroSorteadoApos = await requestHttp(`/admin/campanhas/${testCampId}/participantes?status=sorteado`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Filtro por status=sorteado retorna o participante contemplado', filtroSorteadoApos.status === 200 && filtroSorteadoApos.body.length === 1 && filtroSorteadoApos.body[0].id === partSorteadoId);

    const filtroDispApos = await requestHttp(`/admin/campanhas/${testCampId}/participantes?status=disponivel`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Filtro por status=disponivel retorna os participantes restantes disponíveis', filtroDispApos.status === 200 && filtroDispApos.body.length === 2);

    // 19. Auditoria de Conferência Final
    console.log('\n[19] Auditoria e Conferência Final da Campanha');
    const confFinal = await requestHttp(`/admin/campanhas/${testCampId}/conferencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ok('Conferência final: 1 participante sorteado, 2 disponíveis',
      confFinal.body.participantes.sorteados === 1 &&
      confFinal.body.participantes.disponiveis === 2 &&
      confFinal.body.numeros.sorteados === 1 &&
      confFinal.body.numeros.disponiveis === 20
    );

  } catch (err) {
    console.error('Erro inesperado durante a execução dos testes:', err);
    falhou++;
  } finally {
    // Limpeza opcional dos dados temporários do teste
    if (testCampId) {
      try {
        const db = getDb();
        await db('sorteios').where({ campanha_id: testCampId }).delete();
        await db('participantes').where({ campanha_id: testCampId }).delete();
        await db('numeros').where({ campanha_id: testCampId }).delete();
        await db('campanhas').where({ id: testCampId }).delete();
      } catch (cleanErr) {
        // Silêncio na limpeza
      }
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
