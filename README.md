# Sorteio Master

![Sorteio Master](ux/Logo%20Sorteio%20Master%20em%20Estilo%20Cassino.png)

Plataforma profissional de gestão e realização de sorteios e roletas eletrônicas para eventos corporativos e campanhas promocionais.

---

## 1. Visão Geral

O **Sorteio Master** é um sistema completo desenvolvido para controle rigoroso, auditoria e execução de sorteios com total transparência e segurança. A plataforma é estruturada com backend em Node.js (Express + Knex + MySQL) e frontend moderno em React + Vite.

### Principais Características
- **Auditoria e Integridade:** Nenhum participante ou número pode ser contemplado duas vezes simultaneamente.
- **Cancelamento Seguro com Reativação:** O cancelamento preserva integralmente o histórico de auditoria e libera de forma precisa o participante e o número associado.
- **Sorteio Criptográfico:** A escolha do número vencedor é efetuada no backend através de fonte segura de entropia (`crypto.randomInt`), impedindo manipulação por clientes.
- **Conferência de Compatibilidade:** Regra estrita de validação entre total de participantes e números da campanha antes da ativação.
- **Importação Flexível:** Leitura, pré-visualização e confirmação de arquivos XLSX, XLS e CSV.
- **Exportação de Resultados:** Relatórios completos gerados nos formatos Excel (.xlsx) e CSV.
- **Frontend SPA Responsivo:** Interface administrativa com tema cassino corporativo (azul-marinho e dourado), sidebar retrátil, login integrado com JWT e dashboard consumindo dados reais.

---

## 2. Tecnologias Utilizadas

### Backend
- **Ambiente de Execução:** Node.js (v18+) no Windows (PowerShell)
- **Framework Web:** Express.js 4.x
- **Query Builder / Migrations:** Knex.js 3.x
- **Banco de Dados:** MySQL 8.x (Driver `mysql2`)
- **Segurança:** `bcryptjs` (salt rounds 12), `jsonwebtoken` (JWT), `helmet`, `express-rate-limit`
- **Manipulação de Planilhas:** `xlsx`, `exceljs`, `multer`
- **Validação de Dados:** `express-validator`

### Frontend
- **Framework / Bundler:** React 18 + Vite 5
- **Roteamento:** React Router DOM v6
- **Comunicação HTTP:** Axios (com interceptors de JWT e auto-logout no 401)
- **Ícones:** Lucide React
- **Estilização:** CSS Tokens estruturados e responsivos (Mobile/Tablet/Desktop)

---

## 3. Estrutura de Pastas

```text
roleta/
├── api/
│   ├── database/
│   │   └── migrations/          # Migrations versionadas do Knex
│   ├── scripts/                 # Scripts operacionais (admin, migrations, testes)
│   ├── src/
│   │   ├── config/              # Conexão centralizada com MySQL e Knex
│   │   ├── controllers/         # Camada de controle HTTP
│   │   ├── middlewares/         # Autenticação JWT, upload, rate limit, erros
│   │   ├── models/              # Camada de acesso a dados (Active Record / Knex)
│   │   ├── routes/              # Definição e agrupamento de rotas REST
│   │   ├── services/            # Camada de regras de negócio e transações
│   │   ├── utils/               # Funções utilitárias e classes de erro
│   │   ├── validations/         # Esquemas de validação express-validator
│   │   ├── app.js               # Configuração da aplicação Express
│   │   └── server.js            # Bootstrap e inicialização do servidor
│   ├── .env                     # Variáveis de ambiente (não versionado)
│   ├── .env.example             # Modelo das variáveis de ambiente
│   └── package.json
│
├── frontend/
│   ├── public/                  # Assets estáticos públicos (logo.png)
│   ├── src/
│   │   ├── contexts/            # Contexto de autenticação e sessão (AuthContext)
│   │   ├── layouts/             # Layout administrativo com sidebar retrátil (AdminLayout)
│   │   ├── pages/               # Páginas: Login, Dashboard, Campanhas (placeholder)
│   │   ├── routes/              # Configuração de rotas e PrivateRoute
│   │   ├── services/            # Cliente HTTP Axios configurado com interceptors (api.js)
│   │   ├── styles/              # Design tokens e estilização global (global.css)
│   │   ├── App.jsx              # Raiz da aplicação com rotas e providers
│   │   └── main.jsx             # Ponto de entrada React DOM
│   ├── .env                     # Variáveis locais do frontend (VITE_API_URL)
│   ├── .env.example             # Modelo das variáveis do frontend
│   ├── vite.config.js           # Configuração do Vite
│   └── package.json
│
├── checkpoints/                 # Registros de checkpoints do desenvolvimento
└── ux/                          # Referências visuais e design system (Google Stitch)
```

---

## 4. Pré-requisitos (Windows)

- **Node.js:** Versão 18 ou superior.
- **MySQL Server:** Instalado e em execução localmente na porta 3306.
- **PowerShell:** Terminal padrão no Windows.

---

## 5. Configuração do Ambiente

### 5.1. Backend (`api/.env`)
Na pasta `api/`, configure o arquivo `.env` baseado no `.env.example`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=@mysql1
DB_NAME=sorteio_master
PORT=3001
NODE_ENV=development

API_KEY=sm_dev_a7f3c9e2b8d1f4a6e0c5b3d7f2a9e4c8b6d1f3a5e7c9b2d4f6a8e1c3b5d7f9
JWT_SECRET=sorteio_master_jwt_dev_secret_xK9mP2nQ7vR4tW8yL1aS6hU3jE5bN0cD
JWT_EXPIRES_IN=8h
```

### 5.2. Frontend (`frontend/.env`)
Na pasta `frontend/`, configure o arquivo `.env` baseado no `.env.example`:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 6. Inicialização e Execução

### 6.1. Iniciar a API (Backend)
No terminal PowerShell:
```powershell
cd D:\GeminiCLI\roleta\api
npm install
npm run migrate
npm start
```
*A API iniciará em `http://localhost:3001`.*

### 6.2. Iniciar o Frontend (Vite)
Em outro terminal PowerShell:
```powershell
cd D:\GeminiCLI\roleta\frontend
npm install
npm run dev
```
*O Frontend iniciará em `http://localhost:5173`.*

Para gerar o build de produção:
```powershell
npm run build
```

---

## 7. Endpoints da API

Todas as rotas sob `/api/admin` requerem o cabeçalho `Authorization: Bearer <TOKEN_JWT>`.

| Módulo | Método | Rota | Descrição |
|---|---|---|---|
| **Sistema** | `GET` | `/api/health` | Status da API e conexão MySQL |
| **Autenticação** | `POST` | `/api/auth/login` | Login e emissão de JWT (`{ usuario, senha }`) |
| **Campanhas** | `GET` | `/api/admin/campanhas` | Listar todas as campanhas |
| | `GET` | `/api/admin/campanhas/:id` | Consultar campanha por ID |
| | `POST` | `/api/admin/campanhas` | Criar nova campanha com intervalo |
| | `PUT` | `/api/admin/campanhas/:id` | Editar campanha em preparação |
| | `PATCH` | `/api/admin/campanhas/:id/status` | Alterar status |
| | `GET` | `/api/admin/campanhas/:id/conferencia` | Conferência de compatibilidade |
| **Participantes** | `GET` | `/api/admin/campanhas/:campanha_id/participantes` | Listar participantes com filtros |
| | `GET` | `/api/admin/campanhas/:campanha_id/participantes/disponiveis` | Somente participantes disponíveis |
| | `POST` | `/api/admin/campanhas/:campanha_id/participantes` | Cadastro individual de participante |
| | `PUT` | `/api/admin/participantes/:id` | Editar participante não contemplado |
| | `DELETE` | `/api/admin/participantes/:id` | Excluir participante não contemplado |
| **Importação** | `POST` | `/api/admin/campanhas/:campanha_id/importar/preview` | Upload e prévia de XLSX/XLS/CSV |
| | `POST` | `/api/admin/campanhas/:campanha_id/importar/confirmar` | Confirmação e persistência em lote |
| **Números** | `GET` | `/api/admin/campanhas/:campanha_id/numeros` | Listar números da campanha |
| | `GET` | `/api/admin/campanhas/:campanha_id/numeros/stats` | Estatísticas (total, disponíveis, sorteados) |
| **Sorteios** | `POST` | `/api/admin/campanhas/:campanha_id/sorteios` | Realizar sorteio CSPRNG |
| | `GET` | `/api/admin/campanhas/:campanha_id/sorteios` | Histórico com filtros |
| | `PATCH` | `/api/admin/sorteios/:id/cancelar` | Cancelamento com liberação precisa |
| **Exportação** | `GET` | `/api/admin/campanhas/:campanha_id/exportar/excel` | Baixar planilha Excel (.xlsx) |
| | `GET` | `/api/admin/campanhas/:campanha_id/exportar/csv` | Baixar arquivo CSV (.csv) |

---

## 8. Execução dos Testes Automatizados

No terminal PowerShell:

```powershell
cd D:\GeminiCLI\roleta\api

# Testes de integração do Frontend & Autenticação (Etapa 04)
node scripts/test-runner-etapa04.js

# Testes de integração da API (Etapa 03)
node scripts/test-etapa03.js

# Testes de regressão (Etapa 02)
node scripts/test-etapa02.js
```

---

## 9. Estado Atual do Desenvolvimento

- [x] **Etapa 01:** Estrutura inicial do projeto, banco de dados MySQL e migrations Knex.
- [x] **Etapa 02:** Modelagem funcional completa, segurança, JWT, bcrypt, Helmet e rate limiting.
- [x] **Etapa 03:** Endpoints funcionais de campanhas, participantes, números, sorteio CSPRNG, cancelamento, importação XLSX/XLS/CSV, exportação Excel/CSV e documentação.
- [x] **Etapa 04:** Frontend React + Vite com tela de login integrada, proteção de rotas, layout administrativo responsivo, sidebar retrátil e dashboard consumindo dados reais da API.
- [ ] **Etapa 05:** Frontend - Módulos de gestão de Campanhas, Participantes, Importação e Sorteio com Roleta Eletrônica.
