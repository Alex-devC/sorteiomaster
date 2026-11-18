# Sorteio Master

![Sorteio Master](ux/Logo%20Sorteio%20Master%20em%20Estilo%20Cassino.png)

Plataforma profissional de gestão e realização de sorteios e roletas eletrônicas para eventos corporativos e campanhas promocionais.

---

## 1. Visão Geral

O **Sorteio Master** é um sistema completo desenvolvido para controle rigoroso, auditoria e execução de sorteios com total transparência e segurança. A plataforma é estruturada com backend em Node.js (Express + Knex + MySQL) e frontend em React + Vite.

### Principais Características
- **Auditoria e Integridade:** Nenhum participante ou número pode ser contemplado duas vezes simultaneamente.
- **Cancelamento Seguro com Reativação:** O cancelamento preserva integralmente o histórico de auditoria e libera de forma precisa o participante e o número associado.
- **Sorteio Criptográfico:** A escolha do número vencedor é efetuada no backend através de fonte segura de entropia (`crypto.randomInt`), impedindo manipulação por clientes.
- **Conferência de Compatibilidade:** Regra estrita de validação entre total de participantes e números da campanha antes da ativação.
- **Importação Flexível:** Leitura, pré-visualização e confirmação de arquivos XLSX, XLS e CSV.
- **Exportação de Resultados:** Relatórios completos gerados nos formatos Excel (.xlsx) e CSV.

---

## 2. Tecnologias Utilizadas

- **Ambiente de Execução:** Node.js (v18+) no Windows (PowerShell)
- **Framework Web:** Express.js 4.x
- **Query Builder / Migrations:** Knex.js 3.x
- **Banco de Dados:** MySQL 8.x (Driver `mysql2`)
- **Segurança:** `bcryptjs` (salt rounds 12), `jsonwebtoken` (JWT), `helmet`, `express-rate-limit`
- **Manipulação de Planilhas:** `xlsx`, `exceljs`, `multer`
- **Validação de Dados:** `express-validator`

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
├── frontend/                    # Estrutura base React + Vite (próximas etapas)
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

Na pasta `api/`, crie o arquivo `.env` baseado no `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=@mysql1
DB_NAME=sorteio_master
PORT=3001
NODE_ENV=development

# Chaves de segurança (gerar sequências fortes)
API_KEY=sm_dev_a7f3c9e2b8d1f4a6e0c5b3d7f2a9e4c8b6d1f3a5e7c9b2d4f6a8e1c3b5d7f9
JWT_SECRET=sorteio_master_jwt_dev_secret_xK9mP2nQ7vR4tW8yL1aS6hU3jE5bN0cD
JWT_EXPIRES_IN=8h
```

---

## 6. Instalação e Inicialização

Execute no terminal PowerShell:

```powershell
# 1. Navegue até a pasta da API
cd D:\GeminiCLI\roleta\api

# 2. Instale as dependências
npm install

# 3. Execute as migrations do banco de dados
npm run migrate

# 4. Cadastre o primeiro administrador (interativo)
node scripts/criar-admin.js

# 5. Inicie a API
npm start
```

Para desenvolvimento com recarregamento automático:
```powershell
npm run dev
```

---

## 7. Endpoints da API

Todas as rotas sob `/api/admin` requerem o cabeçalho `Authorization: Bearer <TOKEN_JWT>`.

### 7.1. Sistema e Autenticação
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Verifica status da API e conexão MySQL |
| `POST` | `/api/auth/login` | Autenticação administrativa e emissão de JWT |

### 7.2. Campanhas
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/admin/campanhas` | Criar nova campanha e gerar intervalo de números |
| `GET` | `/api/admin/campanhas` | Listar todas as campanhas |
| `GET` | `/api/admin/campanhas/:id` | Consultar campanha por ID |
| `PUT` | `/api/admin/campanhas/:id` | Editar dados da campanha (em preparação) |
| `PATCH` | `/api/admin/campanhas/:id/status` | Alterar status (`em_preparacao`, `ativa`, `finalizada`, `cancelada`) |
| `GET` | `/api/admin/campanhas/:id/conferencia` | Conferência de compatibilidade entre números e participantes |

### 7.3. Participantes
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/admin/campanhas/:campanha_id/participantes` | Cadastro individual de participante |
| `GET` | `/api/admin/campanhas/:campanha_id/participantes` | Listar participantes com filtros (`status`, `busca`) |
| `GET` | `/api/admin/campanhas/:campanha_id/participantes/disponiveis` | Listar somente participantes disponíveis para sorteio |
| `GET` | `/api/admin/participantes/:id` | Consultar participante individual |
| `PUT` | `/api/admin/participantes/:id` | Editar nome do participante (se não sorteado) |
| `DELETE` | `/api/admin/participantes/:id` | Excluir participante (se não sorteado) |

### 7.4. Importação de Arquivos
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/admin/campanhas/:campanha_id/importar/preview` | Upload e prévia de XLSX/XLS/CSV com validações |
| `POST` | `/api/admin/campanhas/:campanha_id/importar/confirmar` | Confirmação e persistência dos participantes válidos |

### 7.5. Números da Campanha
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/campanhas/:campanha_id/numeros` | Listar números (filtro opcional `?status=disponivel`) |
| `GET` | `/api/admin/campanhas/:campanha_id/numeros/stats` | Estatísticas (total, disponíveis, sorteados) |
| `GET` | `/api/admin/numeros/:id` | Consultar dados de um número individual |

### 7.6. Sorteios
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/admin/campanhas/:campanha_id/sorteios` | Realizar sorteio de participante (número escolhido via CSPRNG) |
| `GET` | `/api/admin/campanhas/:campanha_id/sorteios` | Histórico com filtros (`status`, `participante_id`, `numero`) |
| `GET` | `/api/admin/sorteios/:id` | Consultar detalhes de um sorteio |
| `PATCH` | `/api/admin/sorteios/:id/cancelar` | Cancelar sorteio (preserva histórico e libera recursos) |

### 7.7. Exportação de Relatórios
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/campanhas/:campanha_id/exportar/excel` | Baixar planilha de resultados (.xlsx) |
| `GET` | `/api/admin/campanhas/:campanha_id/exportar/csv` | Baixar planilha de resultados (.csv) |

---

## 8. Execução dos Testes Automatizados

Para executar a suíte completa de testes no PowerShell:

```powershell
cd D:\GeminiCLI\roleta\api
node scripts/test-etapa03.js
```

---

## 9. Estado Atual do Desenvolvimento

- [x] **Etapa 01:** Estrutura inicial do projeto, banco de dados MySQL e migrations Knex.
- [x] **Etapa 02:** Modelagem funcional completa, segurança, JWT, bcrypt, Helmet e rate limiting.
- [x] **Etapa 03:** Endpoints funcionais de campanhas, participantes, números, sorteio CSPRNG, cancelamento, importação XLSX/XLS/CSV, exportação Excel/CSV e documentação.
- [ ] **Etapa 04:** Frontend React + Vite com animação da roleta eletrônica e telas administrativas.
