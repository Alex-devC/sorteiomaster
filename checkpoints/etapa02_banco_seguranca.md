# Checkpoint — Etapa 02: Banco de Dados Funcional e Segurança da API

**Data:** 2026-11-18  
**Branch:** main  
**Status:** ✅ CONCLUÍDA — 30/30 testes aprovados

## O que foi feito

### Migrations criadas (Etapa 02)
- `20241118002_create_usuarios.js` — Tabela usuarios (bcrypt hash)
- `20241118003_create_campanhas.js` — Tabela campanhas com enum de status
- `20241118004_create_participantes_numeros.js` — Tabelas participantes e numeros com FKs e índices
- `20241118005_create_sorteios.js` — Tabela sorteios com FKs e histórico

### Arquitetura criada
- `src/models/` — UsuarioModel, CampanhaModel, ParticipanteModel, NumeroModel, SorteioModel
- `src/services/` — authService, campanhaService, participanteService, sorteioService
- `src/controllers/` — authController, campanhaController, participanteController, numeroController, sorteioController
- `src/routes/` — auth.js, admin.js, sorteio.js (index.js atualizado)
- `src/middlewares/` — autenticar.js (JWT), errorHandler.js, validate.js
- `src/validations/` — authValidation, campanhaValidation, participanteValidation, sorteioValidation
- `src/utils/` — helpers.js (normalizarNome, gerarIntervalo, validarQuantidades), AppError.js
- `scripts/criar-admin.js` — script interativo para criar administrador
- `scripts/criar-admin-test.js` — script de teste com argumentos

### Dependências adicionadas
- bcryptjs (hash de senhas com salt 12)
- jsonwebtoken (JWT 8h)
- helmet (cabeçalhos HTTP de segurança)
- express-rate-limit (proteção brute-force)
- express-validator (validação de dados)

### Regras implementadas
- Senha nunca armazenada em texto puro (bcrypt)
- JWT com expiração de 8h
- Rate limit global: 300 req/15min
- Rate limit login: 20 tentativas/15min
- Transações MySQL com SELECT FOR UPDATE para sorteios
- Histórico de cancelamentos preservado
- Cancelamento libera participante e número exato
- Normalização de nomes (case-insensitive, espaços)
- Validação todos_premiados (participantes ≤ números)

## Resultado dos testes
30/30 aprovados — 0 falhas
