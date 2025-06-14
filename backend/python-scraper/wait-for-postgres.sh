#!/bin/bash
# Script para esperar pela disponibilidade do PostgreSQL antes de iniciar a aplicação

set -e

# Variáveis para conexão com o banco
host="${POSTGRES_HOST:-localhost}"
port="${POSTGRES_PORT:-5432}"
user="${POSTGRES_USER:-postgres}"
password="${POSTGRES_PASSWORD:-admin}"
database="${POSTGRES_DB:-db_juscash}"

# Fallback para variáveis em nome alternativo
host="${DB_HOST:-$host}"
port="${DB_PORT:-$port}"
user="${DB_USERNAME:-$user}"
password="${DB_PASSWORD:-$password}"
database="${DB_NAME:-$database}"

echo "Verificando conexão com o PostgreSQL em $host:$port..."

# Função para testar conexão
test_connection() {
  PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1" > /dev/null 2>&1
}

# Função para pingar host
ping_host() {
  ping -c 1 "$host" > /dev/null 2>&1
}

echo "Verificando disponibilidade da rede para o host $host..."
# Testa ping para o host
if ping_host; then
  echo "Host $host está acessível via ping."
else
  echo "Host $host não responde via ping. Isso pode ser esperado se o host não permitir ICMP."
fi

# Testa conexão TCP com netcat
if nc -z "$host" "$port" > /dev/null 2>&1; then
  echo "Porta $port está aberta no host $host."
else
  echo "Porta $port não está acessível no host $host."
fi

# Tenta conexões enquanto não conseguir
COUNT=0
MAX_TRIES=30
until test_connection; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_TRIES ]; then
    echo "Não foi possível conectar ao PostgreSQL após $MAX_TRIES tentativas."
    exit 1
  fi
  echo "Aguardando o PostgreSQL inicializar... ($COUNT/$MAX_TRIES)"
  sleep 2
done

echo "PostgreSQL está disponível em $host:$port!"

# Executa o comando fornecido
exec "$@" 