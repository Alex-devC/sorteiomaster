# Checkpoint — Etapa 10: Usuários e Gerenciamento Avançado de Campanhas

**Data:** 19/11/2026  
**Status:** Concluído com Sucesso  
**Ambiente:** Windows / Node.js 24 / Express / Knex / MySQL 8 / React 18 / Vite 5  

---

## 1. Escopo Desenvolvido

Nesta etapa foi concluído o módulo de gerenciamento de usuários administrativos e as funcionalidades avançadas de gerenciamento de campanhas (exclusão de campanhas finalizadas e reativação com opções estratégicas).

### 1.1 Gerenciamento de Usuários
- **Listagem Completa:** Listagem de usuários com badges de perfil (Admin Principal / Operador), status ativo/inativo, indicação do próprio usuário autenticado.
- **Cadastro de Usuário:** Modal responsivo com validações completas (nome, login alfanumérico normalizado, senha mínima de 6 caracteres com alternador de visibilidade, situação ativa/inativa).
- **Edição de Dados:** Atualização de nome e situação cadastral com verificação de integridade e unicidade de login.
- **Redefinição de Senha:** Modal dedicado com confirmação de senha, criptografia bcrypt (12 salt rounds) e validação imediata.
- **Ativação / Desativação de Usuários:** Alternância de status com regras de segurança:
  - Bloqueio estrito de auto-desativação do administrador atualmente logado (HTTP 422).
  - Proteção permanente contra desativação acidental da conta do Administrador Principal (`is_admin_principal: true`) tanto no frontend quanto na API (HTTP 422).
  - Bloqueio imediato de autenticação para usuários com status inativo (HTTP 403).
- **Preparação para Permissões:** Coluna `permissoes` (JSON array) e flag `is_admin_principal` presentes na tabela `usuarios` e incorporadas ao payload do token JWT e ao objeto do usuário autenticado.

### 1.2 Exclusão de Campanhas Finalizadas
- **Validação Estrita de Status:** Ação permitida exclusivamente para campanhas com status `finalizada`. Tentativas de excluir campanhas em preparação, ativas ou canceladas são rejeitadas pela API com HTTP 422.
- **Confirmação Explícita:** Modal de alerta irreversível exibindo nome da campanha, intervalo numérico e detalhamento dos dados vinculados.
- **Transação Atômica no MySQL:** Exclusão coordenada em transação protegida (`FOR UPDATE`):
  1. Histórico de sorteios (`sorteios`);
  2. Números gerados (`numeros`);
  3. Participantes vinculados (`participantes`);
  4. Registro da campanha (`campanhas`).
- **Prevenção de Orfandade e Rollback:** Garante ausência total de registros órfãos ou exclusões parciais em caso de falha.

### 1.3 Reativação de Campanhas Finalizadas
- **Modal de Escolha Estratégica:** Apresenta as duas opções obrigatórias para o administrador:
  - **OPÇÃO A — Zerar sorteios e reiniciar tudo:** Cancela sorteios confirmados no histórico registrando o motivo (`Campanha reiniciada: sorteio cancelado para novo ciclo completo`), preservando o histórico integralmente. Libera todos os participantes e números para status `disponivel`, retornando a campanha para status `ativa`.
  - **OPÇÃO B — Continuar de onde parou:** Preserva todos os sorteios confirmados e cancelados anteriores. Mantém participantes e números já contemplados bloqueados (`sorteado`), retornando apenas o status da campanha para `ativa`.
- **Integridade Transacional:** Validação na API exigindo status `finalizada` anterior, bloqueio de reativação duplicada em campanhas já ativas (HTTP 422) e execução sob transação atômica.

---

## 2. Arquivos Criados e Modificados

### Frontend:
- `frontend/src/components/UsuarioFormModal.jsx` *(Criado)*: Modal de criação e edição de usuários.
- `frontend/src/components/UsuarioSenhaModal.jsx` *(Criado)*: Modal de redefinição de senha com confirmação.
- `frontend/src/components/CampanhaExcluirModal.jsx` *(Criado)*: Modal de confirmação explícita de exclusão definitiva.
- `frontend/src/components/CampanhaReativarModal.jsx` *(Criado)*: Modal de reativação com seleção obrigatória de estratégia (zerar vs continuar).
- `frontend/src/pages/Usuarios.jsx` *(Criado)*: Tela administrativa de gestão de usuários.
- `frontend/src/pages/Campanhas.jsx` *(Modificado)*: Adição dos botões Reativar e Excluir para campanhas finalizadas e integração com os novos modais.
- `frontend/src/routes/index.jsx` *(Modificado)*: Registro da rota protegida `/usuarios`.
- `frontend/src/layouts/AdminLayout.jsx` *(Modificado)*: Inclusão do link de navegação "Usuários" na sidebar.

### Backend:
- `api/src/routes/admin.js` *(Modificado)*: Registro de rotas de usuários (`GET`, `POST`, `PUT`, `PATCH /senha`, `PATCH /status`) e campanhas avançadas (`DELETE /campanhas/:id/excluir`, `POST /campanhas/:id/reativar`).
- `api/src/controllers/campanhaController.js` *(Modificado)*: Implementação e exportação dos controllers `excluir` e `reativar`.
- `api/src/services/authService.js` *(Modificado)*: Inclusão de `is_admin_principal` e `permissoes` no payload JWT e na resposta do login.
- `api/scripts/test_etapa10.js` *(Criado)*: Bateria de testes automatizados completa para a Etapa 10.

---

## 3. Endpoints Implementados e Validados

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/admin/usuarios` | Listagem de todos os usuários |
| `GET` | `/api/admin/usuarios/:id` | Busca detalhada de usuário por ID |
| `POST` | `/api/admin/usuarios` | Cadastro de novo usuário |
| `PUT` | `/api/admin/usuarios/:id` | Edição de dados do usuário |
| `PATCH` | `/api/admin/usuarios/:id/senha` | Alteração/redefinição de senha |
| `PATCH` | `/api/admin/usuarios/:id/status` | Ativação/desativação de usuário |
| `DELETE` | `/api/admin/campanhas/:id/excluir` | Exclusão de campanha finalizada e dados dependentes |
| `POST` | `/api/admin/campanhas/:id/reativar` | Reativação de campanha finalizada (opção: `zerar` ou `continuar`) |

---

## 4. Resultados dos Testes

- **Testes da Etapa 10 (`api/scripts/test_etapa10.js`):** 30 testes executados, 30 aprovados (100%).
- **Regressão Etapa 04 (Autenticação e Dashboard):** 12/12 aprovados.
- **Regressão Etapa 05 (Gerenciamento de Campanhas):** 17/17 aprovados.
- **Regressão Etapa 06 (Gerenciamento de Participantes):** 37/37 aprovados.
- **Regressão Etapa 07 (Roleta e Sorteios CSPRNG):** 30/30 aprovados.
- **Regressão Etapa 08 (Histórico e Auditoria):** 28/28 aprovados.
- **Regressão Etapa 09 (Cancelamento e Reativação):** 30/30 aprovados.
- **Build de Produção (Vite):** Compilado com sucesso em 5.96s sem advertências críticas.
