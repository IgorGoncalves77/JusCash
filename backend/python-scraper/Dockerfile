FROM python:3.11-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    curl \
    unzip \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libglib2.0-0 \
    libx11-xcb1 \
    ca-certificates \
    iputils-ping \
    net-tools \
    netcat-openbsd \
    postgresql-client \
    --no-install-recommends

# Configurações para instalação do Chrome
RUN mkdir -p /etc/apt/keyrings
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google.gpg
RUN echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
    > /etc/apt/sources.list.d/google-chrome.list

# Instalar Google Chrome
RUN apt-get update && apt-get install -y \
    google-chrome-stable \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verificar versão do Chrome instalado
RUN echo "Versão do Chrome:" && google-chrome --version

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos
COPY . /app

# Criar diretório para cache do ChromeDriver
RUN mkdir -p /tmp/chromedriver

# Instalar dependências Python
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Definir variáveis de ambiente para o webdriver_manager
ENV WDM_LOG_LEVEL=0
ENV WDM_PROGRESS_BAR=0
ENV WDM_LOCAL=1
ENV WDM_SSL_VERIFY=0
ENV WDM_CACHE_PATH=/tmp

# Definir variáveis de ambiente padrão para o banco de dados
# Estas podem ser sobrescritas na execução do container
ENV DB_HOST=172.31.7.114
ENV DB_PORT=5432
ENV DB_NAME=db_juscash
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=admin

# Script para verificar a conexão com o banco
COPY ./wait-for-postgres.sh /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh

# Verificar a rede
RUN echo "Container está pronto. Ambiente: $(uname -a)"

# Comando de execução com verificação de banco de dados
ENTRYPOINT ["/wait-for-postgres.sh"]
CMD ["python", "main.py"]
