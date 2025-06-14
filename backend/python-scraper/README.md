# Web Scraper do Diário da Justiça Eletrônico (DJE)

Este é um aplicativo Python para realizar web scraping no site do Diário da Justiça Eletrônico (DJE) de São Paulo, buscando publicações específicas relacionadas a "RPV" e "pagamento pelo INSS".

## Funcionalidades

- Realiza consultas avançadas no DJE de São Paulo
- Busca publicações no caderno: "Caderno 3 - Judicial - 1ª Instância - Capital - Parte I"
- Filtra publicações que contenham as palavras-chave: "RPV" e "pagamento pelo INSS"
- Extrai informações como:
  - Número do processo
  - Data de disponibilização
  - Autor(es)
  - Advogado(s)
  - Conteúdo completo da publicação
  - Valor principal bruto/líquido
  - Valor dos juros moratórios
  - Honorários advocatícios
- Salva as informações no banco de dados PostgreSQL
- Executa automaticamente todos os dias às 7h, 12h e 20h
- Gerencia e limpa conexões ociosas do banco de dados
- Compatível com ambiente Windows (desenvolvimento) e Linux/Docker (produção)

## Requisitos

- Python 3.8+
- Google Chrome (instalado automaticamente no Docker)
- PostgreSQL

## Instalação

### Ambiente Local (Windows/Linux)

1. Clone o repositório
2. Instale as dependências:

```bash
pip install -r requirements.txt
```

### Docker (Ambiente de Produção)

O projeto inclui um Dockerfile configurado para execução em ambiente Docker:

```bash
# Construir a imagem Docker
docker build -t juscash-scraper .

# Executar o container
docker stack deploy -c portainer-agent-stack.yml portainer
```

## Configuração

### Variáveis de Ambiente

O aplicativo utiliza as configurações de banco de dados definidas no arquivo `.env` na pasta `backend/node-api` ou variáveis de ambiente:

- `DB_HOST`: Host do PostgreSQL (padrão: localhost)
- `DB_PORT`: Porta do PostgreSQL (padrão: 5432)
- `DB_NAME`: Nome do banco de dados (padrão: db_juscash)
- `DB_USERNAME`: Usuário do PostgreSQL (padrão: postgres)
- `DB_PASSWORD`: Senha do PostgreSQL (padrão: admin)

## Uso

### Execução Manual

Execute o script principal:

```bash
python main.py
```

Isso iniciará o processo de scraping e configurará o agendamento para execuções futuras.

### Logs

O aplicativo gera logs detalhados no arquivo `scraper.log` e na saída padrão.

## Arquitetura do Código

- **main.py**: Script principal que organiza a execução e o agendamento das tarefas

  - Função `executar_scraping()`: Executa o processo completo de scraping
  - Função `limpar_conexoes_ociosas()`: Monitora e finaliza conexões ociosas
  - Agendamento automático das tarefas

- **scraper.py**: Implementa a classe `DJEScraper` responsável pela interação com o site do DJE

  - Inicialização do Chrome/ChromeDriver com detecção de ambiente
  - Métodos para navegar no site, extrair dados e processar publicações
  - Adaptação automática para ambientes Windows e Linux/Docker

- **database.py**: Gerenciamento de conexão e operações no banco de dados

  - Classe `Database` com mecanismo de retry automático
  - Gerenciamento de transações com autocommit
  - Detecção e limpeza de conexões ociosas
  - Funções de compatibilidade com código existente

- **standalone_chrome.py**: Gerenciamento do ChromeDriver

  - Download automático da versão compatível com o Chrome instalado
  - Detecção de sistema operacional e arquitetura
  - Tratamento de falhas com métodos alternativos

- **config.py**: Configurações e constantes do aplicativo

  - Carregamento flexível de variáveis de ambiente
  - Configurações específicas para Docker/desenvolvimento

- **wait-for-postgres.sh**: Script para verificar a disponibilidade do banco de dados
  - Garantia de que o aplicativo inicie apenas após o banco estar disponível

## Agendamento

O aplicativo está configurado para:

- Executar scraping diariamente nos seguintes horários:
  - 07:00
  - 12:00
  - 20:00
- Limpar conexões ociosas no banco a cada 30 minutos
- Pular execuções em finais de semana (sábado e domingo)

## Primeira Execução

Na primeira execução (quando o banco de dados está vazio), o aplicativo busca publicações dos últimos 31 dias. Nas execuções subsequentes, busca apenas as publicações do dia atual.
