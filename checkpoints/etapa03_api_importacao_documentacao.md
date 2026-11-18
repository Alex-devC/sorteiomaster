# Checkpoint — Etapa 03: API Funcional, Importação e Documentação

**Data:** 2026-11-18  
**Status:** ✅ CONCLUÍDA — 35/35 testes da Etapa 03 aprovados e 30/30 testes de regressão da Etapa 02 aprovados.

## 1. O que foi feito

### 1.1. Dependências Adicionadas
- `xlsx`: Leitura e parsing de arquivos XLSX, XLS e CSV.
- `multer`: Middleware multipart/form-data com limite de tamanho (10MB) e validação de extensão.
- `exceljs`: Geração de planilhas formatadas para exportação (.xlsx).

### 1.2. Campanhas
- CRUD completo com endpoints:
  - `GET /api/admin/campanhas`
  - `GET /api/admin/campanhas/:id`
  - `POST /api/admin/campanhas`
  - `PUT /api/admin/campanhas/:id` (com regeneração do intervalo em status `em_preparacao`)
  - `PATCH /api/admin/campanhas/:id/status` (validação de transições e conferência na ativação)
  - `GET /api/admin/campanhas/:id/conferencia` (regra estrita `todos_premiados`)
- Regra de bloqueio de alteração de intervalo após realização de sorteios.

### 1.3. Participantes
- Endpoints de gestão:
  - `POST /api/admin/campanhas/:campanha_id/participantes` (com normalização de espaços e case)
  - `GET /api/admin/campanhas/:campanha_id/participantes` (com suporte a `?status=` e `?busca=`)
  - `GET /api/admin/campanhas/:campanha_id/participantes/disponiveis` (somente aptos a sorteio)
  - `GET /api/admin/participantes/:id`
  - `PUT /api/admin/participantes/:id` (bloqueado para contemplados)
  - `DELETE /api/admin/participantes/:id` (bloqueado para contemplados)

### 1.4. Importação XLSX, XLS e CSV
- Endpoint de pré-visualização:
  - `POST /api/admin/campanhas/:campanha_id/importar/preview`
  - Identificação dinâmica de colunas, validação de vazios, duplicados no arquivo e já cadastrados na campanha.
- Endpoint de confirmação:
  - `POST /api/admin/campanhas/:campanha_id/importar/confirmar`
  - Inserção em lote (batches de 500) dos registros válidos.

### 1.5. Números da Campanha
- Endpoints:
  - `GET /api/admin/campanhas/:campanha_id/numeros` (filtro `?status=`)
  - `GET /api/admin/campanhas/:campanha_id/numeros/stats` (totais, disponíveis e sorteados)
  - `GET /api/admin/numeros/:id`

### 1.6. Realização de Sorteios e CSPRNG
- Endpoint `POST /api/admin/campanhas/:campanha_id/sorteios`:
  - Seleção aleatória pelo backend utilizando `crypto.randomInt` (CSPRNG).
  - Bloqueio transacional de leitura exclusiva (`SELECT FOR UPDATE`) para evitar concorrência e duplicidade.
  - Bloqueio imediato do participante e do número.

### 1.7. Cancelamento e Reativação
- Endpoint `PATCH /api/admin/sorteios/:id/cancelar`:
  - Preservação integral do registro histórico e auditoria (motivo e timestamp).
  - Liberação exata do participante e do número associado ao sorteio cancelado.
  - Possibilidade de nova participação imediata.

### 1.8. Exportação de Relatórios
- Endpoints:
  - `GET /api/admin/campanhas/:campanha_id/exportar/excel` (.xlsx via ExcelJS)
  - `GET /api/admin/campanhas/:campanha_id/exportar/csv` (.csv formatado em UTF-8 com BOM)

### 1.9. Documentação
- `README.md` atualizado na raiz com documentação profissional, logo, especificações técnicas, rotas, comandos PowerShell e guia de testes.

## 2. Testes Executados
- `scripts/test-etapa03.js`: **35 aprovados, 0 falhas**.
- `scripts/test-etapa02.js`: **30 aprovados, 0 falhas** (regressão sem quebras).
- Verificação direta de integridade e auditoria no MySQL confirmada.
