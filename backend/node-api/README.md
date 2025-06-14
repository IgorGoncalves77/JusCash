# API Node.js - Sistema de Gerenciamento JusCash DJE-SP

API REST desenvolvida em Node.js para o sistema de gerenciamento de publicações do Diário da Justiça Eletrônico de São Paulo. Este componente é responsável por fornecer a interface de comunicação para o frontend e gerenciar os dados capturados pelo scraper Python.

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript
- **Express**: Framework web para criação de APIs RESTful
- **Sequelize**: ORM para interação com banco de dados PostgreSQL
- **JWT**: Autenticação e autorização baseada em tokens
- **bcryptjs**: Criptografia de senhas
- **Swagger**: Documentação da API
- **Compression**: Compressão de respostas HTTP
- **Helmet**: Segurança de cabeçalhos HTTP
- **Morgan**: Logging de requests
- **Rate Limiter**: Proteção contra ataques de força bruta

## Requisitos

- Node.js 16+
- PostgreSQL 13+

## Integração com o Python Scraper

Esta API trabalha em conjunto com o componente Python Scraper para formar o sistema completo:

- **API Node.js**: Gerencia requisições do frontend, autenticação de usuários e manipulação dos dados
- **Python Scraper**: Responsável pela coleta automática de dados do DJE-SP

Ambos os componentes compartilham o mesmo banco de dados PostgreSQL.

## Estrutura do Projeto

```
node-api/
├── src/
│   ├── controllers/     # Controladores da aplicação
│   ├── middleware/      # Middlewares (auth, error handling)
│   ├── models/          # Modelos do Sequelize
│   ├── routes/          # Definição de rotas da API
│   ├── utils/           # Funções utilitárias
│   ├── configdb/        # Configuração do banco de dados
│   └── app.js           # Ponto de entrada da aplicação
├── .env                 # Variáveis de ambiente
├── Dockerfile           # Configuração para criação da imagem Docker
└── package.json         # Dependências e scripts
```

## Instalação

### Ambiente Local (Windows/Linux)

1. Instale as dependências:

```bash
npm install
```

### Docker (Ambiente de Produção)

O projeto inclui um Dockerfile configurado para execução em ambiente Docker:

```bash
# Construir a imagem Docker
docker build -t juscash-api-node:1.0.0 .

# Executar o container
docker stack deploy -c portainer-agent-stack.yml portainer
```

## Configuração

### Variáveis de Ambiente

Configure o arquivo `.env` na raiz do projeto:

```env
# Ambiente
NODE_ENV=development
PORT=3001

# Configurações do banco de dados
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin
DB_NAME=db_juscash
DB_NAME_TEST=db_juscash

# Configurações de segurança
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=10

# Frontend URL para CORS
FRONTEND_URL=http://localhost:3000
```

## Uso

### Execução Manual

```bash
# Desenvolvimento com nodemon (auto-reload)
npm start
```

A API estará disponível em `http://localhost:3001`

## Segurança

- Autenticação baseada em tokens JWT
- Proteção contra XSS com Helmet
- Rate limiting para prevenção de força bruta
- Criptografia de senhas com bcrypt
- Níveis de acesso (usuário normal e admin)

## Monitoramento e Logs

- Logging de solicitações com Morgan
- Health check endpoint: `GET /health`
- Modo de ambiente configurável (development/production)

## Primeira Execução

Na primeira execução, o aplicativo criará automaticamente as tabelas no banco de dados, bem como o primeiro usuário para acessar o sistema.
Email: admin@juscash.com.br
Senha: Admin@123
