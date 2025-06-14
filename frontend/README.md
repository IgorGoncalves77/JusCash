# Frontend JusCash - Sistema de Gerenciamento de Publicações DJE-SP

Interface de usuário do sistema JusCash, desenvolvida em React para gerenciamento de publicações do Diário da Justiça Eletrônico de São Paulo.

## Tecnologias Utilizadas

- **React 18**: Biblioteca JavaScript para construção de interfaces de usuário
- **Redux Toolkit**: Gerenciamento de estado global com abordagem moderna
- **Material UI v7**: Framework de componentes de UI com design system completo
- **React Router v7**: Roteamento e navegação entre páginas
- **Formik & Yup**: Gerenciamento e validação avançada de formulários
- **Hello Pangea DnD**: Drag and Drop para o Kanban (fork moderno do react-beautiful-dnd)
- **Axios**: Cliente HTTP para requisições à API

## Integração com Backend

O frontend se comunica com a API Node.js RESTful para operações como:

- Autenticação de usuários
- Recuperação e manipulação de publicações do DJE
- Atualização de status de publicações em interface Kanban

## Requisitos

- Node.js 16+
- npm ou yarn

## Estrutura do Projeto

```
frontend/
├── public/                 # Arquivos públicos e index.html
├── src/
│   ├── assets/             # Imagens, ícones e recursos estáticos
│   ├── components/         # Componentes reutilizáveis
│   ├── context/            # Contextos do React para estado compartilhado
│   ├── pages/              # Páginas da aplicação
│   │   ├── Cadastro/       # Página de cadastro
│   │   ├── Kanban/         # Página principal com o Kanban
│   │   └── Login/          # Página de login
│   ├── redux/              # Configuração e lógica do Redux Toolkit
│   │   ├── actions/        # Actions do Redux
│   │   └── reducers/       # Reducers e slices do Redux Toolkit
│   ├── services/           # Serviços para comunicação com API
│   ├── themes/             # Configuração de tema do Material UI
│   ├── utils/              # Funções utilitárias e helpers
│   ├── App.js              # Componente principal e rotas
│   └── index.js            # Ponto de entrada
├── .env                    # Variáveis de ambiente
├── Dockerfile              # Configuração para build do container
└── package.json            # Dependências e scripts
```

## Instalação

### Ambiente Local

1. Clone o repositório e acesse a pasta do frontend:

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
```

3. Configure o arquivo `.env` na raiz do projeto:

```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_NAME=JusCash
REACT_APP_VERSION=1.0.0
```

### Docker

Para construir e executar o frontend em um container Docker:

```bash
# Construir a imagem
docker build -t juscash-frontend:1.0.0 .

# Executar o container
docker stack deploy -c portainer-agent-stack.yml portainer
```

## Executando o Projeto

### Desenvolvimento

```bash
npm start
# ou
yarn start
```

A aplicação estará disponível em `http://localhost:3000`

### Produção

```bash
npm run build
# ou
yarn build
```

## Recursos Principais

### Autenticação

- Login de usuário com validação
- Cadastro de novo usuário com validações de senha
- Persistência de sessão com tokens JWT
- Rotas protegidas

### Interface Kanban

- Visualização de publicações em colunas por status
- Movimentação de cards via drag-and-drop
- Regras de negócio para movimentação entre colunas
- Carregamento incremental (scroll infinito) para melhor performance

### Busca e Filtros

- Busca por texto (número do processo, partes, advogados)
- Filtro por período de data
- Debounce para otimização de requisições à API

### Modal de Detalhes

- Visualização completa dos dados da publicação
- Edição inline de informações
- Layout responsivo

## Layout Responsivo

A aplicação está adaptada para funcionar em:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Temas e Personalização

A interface utiliza o Material UI com tema personalizado:

- **Cores Principais**:

  - Verde Primário: `#2cbd62`
  - Azul Escuro: `#072854`
  - Fundo Cinza Claro: `#f1f1f1`

- **Fontes**:
  - Principal: Roboto
  - Headings: Montserrat

## Segurança

- Tokens JWT armazenados de forma segura
- Proteção contra XSS
- Validações de formulários em frontend e backend
- Tempo de expiração de sessão configurável
