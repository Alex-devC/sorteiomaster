# Checkpoint — Etapa 01: Estrutura do Projeto e Migrations

**Data:** 2026-11-18  
**Branch:** main  
**Commit:** c71231c  

## Status: ✅ CONCLUÍDA

## O que foi feito

### Estrutura criada
- `api/` — Backend Node.js completo
- `api/src/config/database.js` — Configuração centralizada do Knex + funções de migration
- `api/src/controllers/healthController.js` — Health check controller
- `api/src/routes/index.js` — Roteamento Express
- `api/src/app.js` — Configuração Express
- `api/src/server.js` — Bootstrap da API (verifica banco → roda migrations → sobe servidor)
- `api/database/migrations/20241118001_init_database.js` — Migration inicial
- `api/scripts/migrate.js` — Script de execução de migrations
- `api/scripts/migrate-status.js` — Script de status das migrations
- `api/scripts/migrate-rollback.js` — Script de rollback
- `api/knexfile.js` — Configuração Knex para CLI
- `api/.env` — Credenciais de desenvolvimento (NÃO versionado)
- `api/.env.example` — Exemplo sem credenciais
- `api/.gitignore` — Exclui .env e node_modules
- `frontend/package.json` — Estrutura React + Vite preparada
- `frontend/.env.example` — VITE_API_URL configurado
- `frontend/.gitignore`

### Dependências instaladas
- dotenv ^16.4.5
- express ^4.19.2
- knex ^3.1.0
- mysql2 ^3.9.7
- nodemon ^3.1.3 (dev)

### Banco de dados
- `sorteio_master` criado automaticamente
- Tabelas: `knex_migrations`, `knex_migrations_lock`, `system_metadata`

## Testes executados
1. ✅ Conexão com MySQL verificada
2. ✅ Migration inicial executada (batch 1)
3. ✅ Banco `sorteio_master` criado e verificado
4. ✅ Re-execução de migrations — sem duplicação
5. ✅ Status das migrations verificado
6. ✅ API iniciada com sucesso em http://localhost:3001
7. ✅ GET /api/health retornou status 200 com {"status":"ok"}
8. ✅ Push para GitHub realizado

## Comandos úteis
- Iniciar API: `cd api && npm start`
- Dev mode: `cd api && npm run dev`
- Migrations: `npm run migrate`
- Status: `npm run migrate:status`
- Rollback: `npm run migrate:rollback`
