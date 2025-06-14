# JusCash - Sistema de Gerenciamento de Publicações do DJE São Paulo

Sistema integrado para captura automática, processamento e gerenciamento de publicações do Diário da Justiça Eletrônico (DJE) de São Paulo, focado em otimizar o fluxo de trabalho de escritórios jurídicos.

## Visão Geral

O JusCash automatiza o monitoramento diário do Diário da Justiça Eletrônico (DJE) de São Paulo, extraindo publicações relevantes para posterior processamento em uma interface Kanban intuitiva, permitindo melhor organização e fluxo de trabalho.

## Arquitetura do Sistema

A aplicação é composta por três componentes principais em uma arquitetura microserviços:

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │      │                   │
│  Python Scraper   │──┬──▶│  Node.js API      │◀────▶│  React Frontend   │
│  (Coleta de dados)│  │   │  (Backend REST)   │      │  (Interface Kanban)│
│                   │  │   │                   │      │                   │
└───────────────────┘  │   └───────────────────┘      └───────────────────┘
         │             │             │                           │
         │             │             │                           │
         ▼             │             ▼                           │
┌───────────────────┐  │   ┌───────────────────┐                 │
│ Chrome + Driver   │  │   │  SQL Database     │◀────────────────┘
│ (Navegação web)   │  └──▶│  (PostgreSQL)     │
│                   │      │                   │
└───────────────────┘      └───────────────────┘
```

### Fluxo de Dados

1. O **Python Scraper** acessa diariamente o DJE-SP, coleta as publicações e as armazena no banco de dados
2. A **API Node.js** fornece endpoints RESTful para acesso e manipulação das publicações
3. O **Frontend React** apresenta uma interface Kanban para gerenciamento das publicações

## Estrutura do Projeto

```
├── backend/
│   ├── python-scraper/          # Web Scraping e automação (Python)
│   │   ├── src/                 # Código-fonte do scraper
│   │   ├── Dockerfile           # Configuração para containerização
│   │   └── README.md            # Documentação específica do scraper
│   │
│   └── node-api/                # API RESTful (Node.js/Express)
│       ├── src/                 # Código-fonte da API
│       ├── Dockerfile           # Configuração para containerização
│       └── README.md            # Documentação específica da API
│
├── frontend/                    # Interface de usuário (React)
│   ├── src/                     # Código-fonte do frontend
│   ├── Dockerfile               # Configuração para containerização
│   └── README.md                # Documentação específica do frontend
│
└── configs/                     # Configurações globais
    └── traefik/                 # Configurações de proxy reverso
    └── docker-compose.yml       # Orquestração dos serviços
    └── README.md                # Documentação específica do servidor em nuvem
```

## Tecnologias Utilizadas

### Backend Python (Web Scraping)

- **Python 3.9+**: Linguagem base para o scraper
- **Selenium WebDriver**: Automação de navegador web
- **ChromeDriver**: Driver para controle do Chrome
- **SQLAlchemy**: ORM para manipulação do banco de dados
- **Docker**: Containerização para deployment

### Backend Node.js (API)

- **Node.js 18+**: Runtime JavaScript para o servidor
- **Express.js**: Framework web para APIs
- **Sequelize**: ORM para PostgreSQL
- **JWT**: Autenticação e autorização
- **Docker**: Containerização para deployment

### Frontend

- **React 18**: Biblioteca para criação de interfaces
- **Redux Toolkit**: Gerenciamento de estado global
- **Material UI v7**: Framework de componentes de UI
- **Hello Pangea DnD**: Funcionalidade drag-and-drop para o Kanban

### Infraestrutura

- **PostgreSQL**: Banco de dados relacional
- **Docker & Docker Compose & Portainer**: Containerização e orquestração
- **traefik**: proxy reverso

## Principais Funcionalidades

### Captura de Dados (Python Scraper)

- ✅ Coleta automatizada diária das publicações do DJE-SP (Caderno 3)
- ✅ Extração inteligente com foco em processos contra o INSS
- ✅ Processamento de texto para identificação de valores e partes

### API REST (Node.js)

- ✅ Autenticação segura com JWT
- ✅ CRUD completo para publicações e usuários
- ✅ Filtros avançados por data, status e texto

### Interface Kanban (React)

- ✅ Dashboard visual para acompanhamento de publicações
- ✅ Sistema Kanban com colunas de status
- ✅ Busca avançada com filtros combinados
- ✅ Visualização detalhada de publicações
- ✅ Design responsivo para múltiplos dispositivos

### Executando Componentes Individualmente

Para desenvolvimento ou execução, consulte os READMEs específicos:

- [README do Frontend](./frontend/README.md)
- [README do Python Scraper](./backend/python-scraper/README.md)
- [README da API Node.js](./backend/node-api/README.md)
