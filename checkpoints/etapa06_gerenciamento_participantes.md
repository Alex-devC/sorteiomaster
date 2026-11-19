# Checkpoint — Etapa 06: Frontend — Gerenciamento de Participantes

**Data:** 2026-11-19  
**Status:** ✅ CONCLUÍDA — Módulo completo de gerenciamento de participantes integrado ao frontend React, build de produção validado e 37/37 testes automatizados aprovados.

---

## 1. O que foi feito

### 1.1. Telas e Componentes Desenvolvidos

- **`Participantes.jsx` (`frontend/src/pages/Participantes.jsx`):**
  - Tela completa de gerenciamento vinculada a uma campanha específica via rota `/campanhas/:campanha_id/participantes`.
  - Cabeçalho detalhado identificando: Nome da campanha, intervalo numérico, total de números gerados, badge de situação da campanha e contador de participantes cadastrados.
  - Botão de navegação rápida para retorno à listagem de campanhas (`Voltar às Campanhas`).
  - Painel de Conferência e Auditoria da Campanha: consome em tempo real `GET /api/admin/campanhas/:campanha_id/conferencia` apresentando mini-cards métricos (Participantes Total, Disponíveis, Sorteados, Números Total, Disponíveis e Sorteados) e badge de compatibilidade (`Configuração Compatível` / `Configuração Incompatível`) com texto de auditoria.
  - Barra de filtros com busca textual por nome (disparo por botão ou tecla Enter) e select de filtragem por situação (`Todas`, `Disponíveis`, `Sorteados`), além de botão para limpar filtros.
  - Listagem em tabela responsiva com colunas: ID, Nome, Situação (`Disponível` / `Sorteado`), Data de Cadastro e Ações contextuais.
  - Ações contextuais: Botões de edição (Edit2) e exclusão (Trash2) habilitados estritamente para participantes com status `disponivel`. Participantes sorteados exibem badge travada de contemplado e são protegidos contra alteração/exclusão.
  - Estados de interface: Carregando (spinner animado), Vazio inicial, Vazio com filtros aplicados e Erro com botão de recarregar.

- **`ParticipanteFormModal.jsx` (`frontend/src/components/ParticipanteFormModal.jsx`):**
  - Modal reutilizável para criação e edição de participantes individuais.
  - Campo único: Nome Completo do Participante (sem campos desnecessários como CPF ou telefone).
  - Validação de preenchimento, autoFocus, trim e bloqueio contra submissões repetidas.

- **`ParticipanteDeleteModal.jsx` (`frontend/src/components/ParticipanteDeleteModal.jsx`):**
  - Confirmação explícita de exclusão destacando o nome do participante.
  - Mensagem explicativa alertando sobre o bloqueio de exclusão de participantes sorteados.

- **`ImportacaoModal.jsx` (`frontend/src/components/ImportacaoModal.jsx`):**
  - Fluxo obrigatório de 3 etapas com stepper visual:
    1. **Selecionar Arquivo:** Dropzone com suporte a drag-and-click para arquivos `.xlsx`, `.xls` e `.csv` (limite 10MB) e card com nome/tamanho do arquivo selecionado.
    2. **Prévia & Validação:** Envio multipart/form-data para `POST /api/admin/campanhas/:campanha_id/importar/preview`. Seleção dinâmica de coluna, cards de diagnóstico (Encontrados, Válidos, Duplicados/Inválidos), detalhamento de linhas e amostra em pills dos nomes válidos.
    3. **Confirmação & Persistência:** Envio da lista completa de nomes válidos (`previewData.nomes_validos`) para `POST /api/admin/campanhas/:campanha_id/importar/confirmar` e tela de sucesso com total efetivamente importado.

### 1.2. Integrações no Sistema

- **`Campanhas.jsx`:** Adicionado botão de atalho direto para gestão de participantes na coluna de ações da tabela de campanhas (ícone `Users` com tooltip `Gerenciar Participantes`).
- **`routes/index.jsx`:** Adicionada a rota protegida `/campanhas/:campanha_id/participantes` vinculada ao `AdminLayout` e `PrivateRoute`.
- **`styles/global.css`:** Adicionadas classes estilizadas para stepper de importação (`.import-stepper`), dropzone (`.file-dropzone`), card de arquivo (`.selected-file-card`), badges de status (`.status-disponivel`, `.status-sorteado`), barra de filtros (`.filter-bar`) e mini-cards de conferência (`.conferencia-card-grid`).

---

## 2. Endpoints da API Utilizados

| Método | Endpoint | Finalidade |
|---|---|---|
| `GET` | `/api/admin/campanhas/:id` | Obter dados da campanha (nome, intervalo, status) |
| `GET` | `/api/admin/campanhas/:id/conferencia` | Atualizar indicadores e compatibilidade em tempo real |
| `GET` | `/api/admin/campanhas/:campanha_id/participantes` | Listar participantes com filtros `?status=` e `?busca=` |
| `POST` | `/api/admin/campanhas/:campanha_id/participantes` | Cadastrar participante individual (`{ nome }`) |
| `PUT` | `/api/admin/participantes/:id` | Editar nome do participante (`{ nome }`) |
| `DELETE` | `/api/admin/participantes/:id` | Excluir participante disponível |
| `POST` | `/api/admin/campanhas/:campanha_id/importar/preview` | Upload e prévia da planilha (XLSX, XLS, CSV) |
| `POST` | `/api/admin/campanhas/:campanha_id/importar/confirmar` | Confirmar e persistir participantes em lote |

---

## 3. Regras de Negócio Respeitadas

1. **Vínculo estrito com a campanha:** Todos os participantes pertencem exclusivamente à campanha selecionada.
2. **Cadastro restrito ao nome:** Apenas o campo nome é solicitado e persistido, com normalização automática no backend.
3. **Tratamento de duplicidade:** Bloqueio de duplicidades normalizadas com código HTTP 409 e mensagem descritiva.
4. **Proteção de participante sorteado:** Participantes já sorteados não podem ser editados (HTTP 422) nem excluídos (HTTP 422).
5. **Idempotência e segurança na importação:** Nenhum registro é gravado no preview; a gravação só ocorre após confirmação explícita do operador.
6. **Conferência em tempo real:** Totais de participantes e números e compatibilidade (`todos_premiados`) são recalculados após qualquer inclusão, edição, exclusão ou importação.

---

## 4. Testes e Validação

- **Build de Produção do Frontend:** Executado com sucesso via Vite (`dist/` gerado sem falhas de import ou compilação).
- **Suíte de Testes Automatizados da Etapa 06 (`api/scripts/test-runner-etapa06.js`):**
  - **37 testes executados | 37 aprovados | 0 falhas.**
  - Validações cobertas: Autenticação JWT, bloqueio 401 sem token, listagem inicial vazia, validação de nome em branco (400), cadastro válido (201), bloqueio de duplicidade normalizada (409), edição de participante (200), pesquisa parcial por nome, filtro por situação (disponível/sorteado), prévia de arquivo XLSX com diagnósticos detalhados, prévia de arquivo CSV, confirmação de importação em lote (200), exclusão de participante disponível (200), bloqueio de edição de participante sorteado (422), bloqueio de exclusão de participante sorteado (422) e conferência de compatibilidade final da campanha.
- **Testes de Regressão das Etapas Anteriores:**
  - Etapa 02: 30 aprovados / 0 falhas.
  - Etapa 03: 35 aprovados / 0 falhas.
  - Etapa 04: 12 aprovados / 0 falhas.
  - Etapa 05: 17 aprovados / 0 falhas.
