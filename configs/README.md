# 📘 Guia de Instalação e Configuração do Servidor ChatOlga

## 📍 Acesso ao Servidor

- **IP:** `***.***.***.***`
- **Usuário:** `***`
- **chave:** `***`

---

## 🐳 Instalação do Docker e Inicialização do Swarm

### Atualizar o sistema:

```bash
sudo apt-get update
sudo apt upgrade
```

### Instalar dependências e Docker:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
```

### Habilitar e iniciar Docker:

```bash
sudo sh get-docker.sh
```

### Inicializar Docker Swarm:

```bash
docker swarm init
```

**Token do Swarm:**

```bash
docker swarm join --token ********
```

---

## 🗂️ Criar Pasta para Projeto

```bash
sudo mkdir /JusCash
sudo chown -R 1000:1000 /JusCash/
```

### (Azure) Alterar permissões:

```bash
sudo chown -R ubuntu:ubuntu /JusCash
sudo chmod -R 755 /JusCash
```

---

## 🐳 Implantação do Portainer (Gerenciador de Containers)

### Baixar stack do Portainer:

```bash
mkdir /portainer
curl -L https://downloads.portainer.io/ce2-19/portainer-agent-stack.yml -o portainer-agent-stack.yml
```

### Implantar stack no Swarm:

```bash
docker stack deploy -c portainer-agent-stack.yml portainer
```

### Acesso ao Portainer

- **Porta:** `9000`
- **Usuário:** `admin@juscash.com.br`
- **Senha:** `Adminjuscash@123`

---

## 🐘 Instalação do PostgreSQL

### Instalar pacotes:

```bash
sudo apt install curl ca-certificates
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
sudo apt update
```

### Inicializar e habilitar o PostgreSQL:

```bash
sudo apt -y install postgresql
```

### Verificar status do serviço:

```bash
sudo systemctl status postgresql
```

### Configurar PostgreSQL:

```bash
sudo -i -u postgres
psql
\password postgres
```

### Criar banco e schema:

```sql
CREATE DATABASE db_juscash;
exit
```

### Editar configurações:

```bash
nano /etc/postgresql/17/main/postgresql.conf
```

Alterar:

```
listen_addresses = '*'
timezone = 'America/Sao_Paulo'
```

```bash
nano /etc/postgresql/17/main/pg_hba.conf
```

Alterar IPv4:

```
host all all 0.0.0.0/0 md5
```

```bash
sudo systemctl restart postgresql
```

---

## 🟢 Instalação do Node.js

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 22
node -v
nvm current
npm -v
```

---

## 🔒 Configuração de Redes Docker com Traefik

```bash
docker network create --driver=overlay --attachable traefik_public
docker network create --driver=overlay --attachable agent_network
```

### Implante a Stack do Traefik:

```bash
docker stack deploy -c traefik-stack.yml traefik
```

---

## ♻️ Reimplantar Stack do Portainer

```bash
docker stack deploy -c portainer-agent-stack.yml portainer
```
