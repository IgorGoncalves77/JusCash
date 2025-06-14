import os
from dotenv import load_dotenv
import datetime
import logging

# Configuração de logging
logger = logging.getLogger("DJE_Scraper")

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv('../node-api/.env')

# Função para obter variáveis de ambiente com fallback
def get_env_var(var_name, default_value, log_msg=None):
    value = os.getenv(var_name, default_value)
    if log_msg:
        logger.info(f"{log_msg}: {value}")
    return value

# Configurações do banco de dados
DB_CONFIG = {
    'host': get_env_var('DB_HOST', 'localhost', 'Utilizando host do banco de dados'),
    'port': get_env_var('DB_PORT', '5432', 'Utilizando porta do banco de dados'),
    'database': get_env_var('DB_NAME', 'db_juscash', 'Utilizando nome do banco de dados'),
    'user': get_env_var('DB_USERNAME', 'postgres', 'Utilizando usuário do banco de dados'),
    'password': get_env_var('DB_PASSWORD', 'admin', 'Utilizando senha do banco de dados')
}

# URLs para o scraping
DJE_URL = "https://dje.tjsp.jus.br/cdje/index.do"
CONSULTA_AVANCADA_URL = "https://dje.tjsp.jus.br/cdje/consultaAvancada.do#buscaavancada"

# Caderno a ser pesquisado
CADERNO = "Caderno 3 - Judicial - 1ª Instância - Capital - Parte I"

# Palavras-chave para busca
PALAVRAS_CHAVE = ["RPV", "pagamento pelo INSS"]

# Dias a serem verificados na primeira execução
DIAS_PRIMEIRA_BUSCA = 31

# Horários de execução diária
HORARIOS_EXECUCAO = ["07:00", "12:00", "20:00"]

# Configuração para tentativas de conexão com o banco
DB_CONNECT_MAX_RETRIES = 5
DB_CONNECT_RETRY_DELAY = 5  # segundos

# Função para verificar se é fim de semana
def eh_fim_de_semana(data):
    """Verifica se a data é sábado (5) ou domingo (6)"""
    return data.weekday() >= 5 