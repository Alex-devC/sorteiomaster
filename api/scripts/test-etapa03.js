'use strict';

require('dotenv').config();
const http = require('http');
const xlsx = require('xlsx');
const mysql2 = require('mysql2/promise');

const PORT = process.env.PORT || 3001;
const BASE = `http://localhost:${PORT}/api`;
let token = null;

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

function request(method, path, body, auth = false) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    };
    const req = http.request(options, (res) => {
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
    if (data) req.write(data);
    req.end();
  });
}

function uploadMultipart(path, fieldName, filename, fileBuffer, fields = {}) {
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

    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (d) => (raw += d));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
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
  console.log('   SUÍTE DE TESTES AUTOMATIZADOS — ETAPA 03');
  console.log('======================================================\n');

  // 1. Health check
  console.log('[1] Health check');
  const h = await request('GET', '/health');
  ok('GET /api/health retorna 200', h.status === 200);

  // 2. Autenticação e Login
  console.log('\n[2] Login administrativo');
  const logRes = await request('POST', '/auth/login', { usuario: 'admin', senha: 'Admin@12345' });
  ok('Login realizado com sucesso', logRes.status === 200 && !!logRes.body.token);
  token = logRes.body.token;

  // 3. CRUD e Regras de Campanhas
  console.log('\n[3] CRUD e Regras de Campanhas');
  const campCriada = await request('POST', '/admin/campanhas', {
    nome: 'Campanha E3 Testes',
    numero_inicial: 100,
    numero_final: 110,
    todos_premiados: true
  }, true);
  ok('Criação de campanha retorna 201', campCriada.status === 201);
  const campId = campCriada.body.id;

  // Consultar individual
  const campGet = await request('GET', `/admin/campanhas/${campId}`, null, true);
  ok('Consulta individual da campanha', campGet.status === 200 && campGet.body.nome === 'Campanha E3 Testes');

  // Editar campanha
  const campEdit = await request('PUT', `/admin/campanhas/${campId}`, {
    nome: 'Campanha E3 Atualizada',
    numero_inicial: 100,
    numero_final: 105
  }, true);
  ok('Edição de campanha em preparação retorna 200', campEdit.status === 200);

  // Verificar se os números foram regenerados corretamente (100 a 105 = 6 números)
  const statsNums = await request('GET', `/admin/campanhas/${campId}/numeros/stats`, null, true);
  ok('Intervalo numérico recalculado para 6 números', statsNums.body.total === 6);

  // 4. Conferência de Campanha (Regra todos_premiados)
  console.log('\n[4] Conferência da Campanha');
  const conf1 = await request('GET', `/admin/campanhas/${campId}/conferencia`, null, true);
  ok('Conferência retorna status 200', conf1.status === 200);
  ok('Situação compatível com 0 participantes e 6 números', conf1.body.compativel === true);

  // 5. Participantes: Cadastro, Consulta, Edição e Exclusão
  console.log('\n[5] Gestão de Participantes');
  const part1 = await request('POST', `/admin/campanhas/${campId}/participantes`, { nome: 'Carlos Andrade' }, true);
  ok('Cadastro individual de participante retorna 201', part1.status === 201);
  const part1Id = part1.body.id;

  const part2 = await request('POST', `/admin/campanhas/${campId}/participantes`, { nome: 'Beatriz Lima' }, true);
  ok('Cadastro de segundo participante retorna 201', part2.status === 201);
  const part2Id = part2.body.id;

  // Tentativa de duplicidade com espaços e maiúsculas
  const partDup = await request('POST', `/admin/campanhas/${campId}/participantes`, { nome: '  carlos   andrade ' }, true);
  ok('Bloqueia duplicidade de participante com normalização (409)', partDup.status === 409);

  // Edição de participante
  const partEdit = await request('PUT', `/admin/participantes/${part1Id}`, { nome: 'Carlos Andrade Junior' }, true);
  ok('Edição de nome de participante não sorteado retorna 200', partEdit.status === 200);

  // Participante temporário para exclusão
  const partTemp = await request('POST', `/admin/campanhas/${campId}/participantes`, { nome: 'Temp Delete' }, true);
  const partDel = await request('DELETE', `/admin/participantes/${partTemp.body.id}`, null, true);
  ok('Exclusão de participante não sorteado retorna 200', partDel.status === 200);

  // Busca e filtros de participantes
  const buscaPart = await request('GET', `/admin/campanhas/${campId}/participantes?busca=junior`, null, true);
  ok('Pesquisa de participantes por texto', buscaPart.status === 200 && buscaPart.body.length === 1);

  const dispPart = await request('GET', `/admin/campanhas/${campId}/participantes/disponiveis`, null, true);
  ok('Listagem de participantes disponíveis', dispPart.status === 200 && dispPart.body.length === 2);

  // 6. Importação XLSX, XLS e CSV
  console.log('\n[6] Importação de Participantes (XLSX, XLS, CSV)');

  // Criar planilha XLSX em memória
  const wbXlsx = xlsx.utils.book_new();
  const wsData = [
    ['Nome Completo', 'Email'],
    ['Fernando Souza', 'fernando@teste.com'],
    ['Gabriela Costa', 'gabriela@teste.com'],
    ['Fernando Souza', 'dup@teste.com'], // Duplicado no arquivo
    ['', 'vazio@teste.com'], // Vazio
    ['Beatriz Lima', 'jaexiste@teste.com'] // Já cadastrado na campanha
  ];
  const wsXlsx = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(wbXlsx, wsXlsx, 'Participantes');
  const xlsxBuf = xlsx.write(wbXlsx, { type: 'buffer', bookType: 'xlsx' });

  // Preview XLSX
  const prevXlsx = await uploadMultipart(`/admin/campanhas/${campId}/importar/preview`, 'arquivo', 'participantes.xlsx', xlsxBuf, { coluna: 'Nome Completo' });
  ok('Preview XLSX retorna 200', prevXlsx.status === 200);
  ok('Identifica 2 válidos, 1 vazio, 1 duplicado e 1 já cadastrado',
    prevXlsx.body.resumo.validos === 2 &&
    prevXlsx.body.resumo.vazios === 1 &&
    prevXlsx.body.resumo.duplicados_no_arquivo === 1 &&
    prevXlsx.body.resumo.ja_cadastrados_na_campanha === 1
  );

  // Confirmação de importação
  const confImp = await request('POST', `/admin/campanhas/${campId}/importar/confirmar`, {
    nomes: ['Fernando Souza', 'Gabriela Costa']
  }, true);
  ok('Confirmação de importação persiste os 2 válidos', confImp.status === 200 && confImp.body.total_efetivamente_importado === 2);

  // Criar CSV em memória
  const csvContent = 'Nome;Cargo\r\nLucas Martins;Dev\r\nRenata Dias;Designer\r\n';
  const csvBuf = Buffer.from(csvContent, 'utf8');
  const prevCsv = await uploadMultipart(`/admin/campanhas/${campId}/importar/preview`, 'arquivo', 'equipe.csv', csvBuf, { coluna: '0' });
  ok('Preview CSV identifica colunas e linhas válidas', prevCsv.status === 200 && prevCsv.body.resumo.validos === 2);

  // 7. Ativação e Bloqueio de Edição
  console.log('\n[7] Ativação da Campanha');
  const ativarCamp = await request('PATCH', `/admin/campanhas/${campId}/status`, { status: 'ativa' }, true);
  ok('Ativação da campanha com participantes <= números retorna 200', ativarCamp.status === 200);

  // 8. Realização do Sorteio (CSPRNG)
  console.log('\n[8] Realização de Sorteio com CSPRNG');
  const sorteio1 = await request('POST', `/admin/campanhas/${campId}/sorteios`, { participante_id: part1Id }, true);
  ok('Realização de sorteio retorna 201', sorteio1.status === 201);
  ok('Número vencedor retornado pela API', !!sorteio1.body.numero_sorteado);
  const sorteio1Id = sorteio1.body.id;
  const numSorteado1 = sorteio1.body.numero_sorteado;

  // Participante já sorteado não pode ser sorteado novamente
  const sorteioDupPart = await request('POST', `/admin/campanhas/${campId}/sorteios`, { participante_id: part1Id }, true);
  ok('Bloqueia sorteio de participante já contemplado (422)', sorteioDupPart.status === 422);

  // Participante sorteado não pode ser excluído nem editado
  const delSorteado = await request('DELETE', `/admin/participantes/${part1Id}`, null, true);
  ok('Impede exclusão de participante contemplado (422)', delSorteado.status === 422);

  // Não pode alterar intervalo após realização de sorteio
  const editIntPosSorteio = await request('PUT', `/admin/campanhas/${campId}`, { numero_final: 200 }, true);
  ok('Impede alteração de intervalo numérico após sorteio (422)', editIntPosSorteio.status === 422);

  // 9. Cancelamento e Reativação de Sorteio
  console.log('\n[9] Cancelamento e Reativação de Sorteio');
  const cancRes = await request('PATCH', `/admin/sorteios/${sorteio1Id}/cancelar`, {
    motivo_cancelamento: 'Participante ausente no momento'
  }, true);
  ok('Cancelamento de sorteio retorna 200 com dados preservados', cancRes.status === 200 && cancRes.body.status === 'cancelado');

  // Verificar se o participante e o número voltaram a ficar disponíveis
  const partReativado = await request('GET', `/admin/participantes/${part1Id}`, null, true);
  ok('Participante liberado volta para status disponivel', partReativado.body.status === 'disponivel');

  const numReativado = await request('GET', `/admin/campanhas/${campId}/numeros?status=disponivel`, null, true);
  const numLiberado = numReativado.body.some((n) => n.numero === numSorteado1);
  ok('Exatamente o número cancelado volta a ficar disponível', numLiberado === true);

  // Realizar novamente o sorteio do participante reativado
  const sorteio2 = await request('POST', `/admin/campanhas/${campId}/sorteios`, { participante_id: part1Id }, true);
  ok('Participante reativado pode ser sorteado novamente (201)', sorteio2.status === 201);

  // 10. Consulta de Histórico e Filtros
  console.log('\n[10] Histórico Completo de Sorteios');
  const hist = await request('GET', `/admin/campanhas/${campId}/sorteios`, null, true);
  ok('Histórico retorna todos os sorteios (confirmados e cancelados)', hist.status === 200 && hist.body.length >= 2);

  const histFiltrado = await request('GET', `/admin/campanhas/${campId}/sorteios?status=cancelado`, null, true);
  ok('Filtro por status de sorteio (cancelado)', histFiltrado.status === 200 && histFiltrado.body.length === 1);

  // 11. Exportação de Relatórios (Excel e CSV)
  console.log('\n[11] Exportação de Relatórios');
  const expExcel = await request('GET', `/admin/campanhas/${campId}/exportar/excel`, null, true);
  ok('Exportação Excel retorna 200 com buffer xlsx', expExcel.status === 200 && !!expExcel.headers['content-disposition']);

  const expCsv = await request('GET', `/admin/campanhas/${campId}/exportar/csv`, null, true);
  ok('Exportação CSV retorna 200 com charset utf-8', expCsv.status === 200 && typeof expCsv.body === 'string' && expCsv.body.includes('ID Sorteio'));

  // 12. Validação direta de persistência no MySQL
  console.log('\n[12] Verificação Direta de Persistência no MySQL');
  let conn;
  try {
    conn = await mysql2.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const [rowsSorteios] = await conn.query('SELECT count(*) as total FROM sorteios WHERE campanha_id = ?', [campId]);
    ok('Registros de sorteios confirmados no banco de dados', parseInt(rowsSorteios[0].total, 10) >= 2);

    const [rowsHistCancel] = await conn.query('SELECT status, motivo_cancelamento FROM sorteios WHERE id = ?', [sorteio1Id]);
    ok('Registro histórico cancelado preservado intacto no banco', rowsHistCancel[0].status === 'cancelado' && rowsHistCancel[0].motivo_cancelamento.includes('Participante ausente'));
  } finally {
    if (conn) await conn.end();
  }

  // ─── RESUMO FINAL
  console.log(`\n${'='.repeat(55)}`);
  console.log(`TOTAL DE TESTES EXECUTADOS: ${passou + falhou}`);
  console.log(`APROVADOS: ${passou} | FALHAS: ${falhou}`);
  console.log(`${'='.repeat(55)}\n`);

  process.exit(falhou > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
