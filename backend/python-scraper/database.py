import psycopg2
from psycopg2 import extras
import logging
from config import DB_CONFIG, DB_CONNECT_MAX_RETRIES, DB_CONNECT_RETRY_DELAY
import datetime
import time

logger = logging.getLogger("DJE_Scraper")

class Database:
    """Classe para gerenciar conexões e operações com o banco de dados"""
    
    def __init__(self):
        """Inicializa a conexão com o banco de dados"""
        # Tenta conectar várias vezes antes de desistir
        self.conn = None
        for tentativa in range(1, DB_CONNECT_MAX_RETRIES + 1):
            self.conn = self.conectar()
            if self.conn:
                logger.info(f"Conexão estabelecida na tentativa {tentativa}")
                if self.criar_tabela_publicacoes():
                    logger.info("Inicialização do banco de dados concluída com sucesso")
                break
            else:
                logger.warning(f"Tentativa {tentativa} de conexão falhou. Aguardando {DB_CONNECT_RETRY_DELAY} segundos...")
                if tentativa < DB_CONNECT_MAX_RETRIES:
                    time.sleep(DB_CONNECT_RETRY_DELAY)
                else:
                    logger.error(f"Todas as {DB_CONNECT_MAX_RETRIES} tentativas de conexão falharam.")
    
    def conectar(self):
        """Estabelece conexão com o banco de dados PostgreSQL"""
        try:
            logger.info(f"Conectando ao banco de dados {DB_CONFIG['database']} no host {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
            # Adiciona timeout explícito para a conexão
            conn = psycopg2.connect(
                host=DB_CONFIG['host'],
                port=DB_CONFIG['port'],
                database=DB_CONFIG['database'],
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                connect_timeout=15  # Timeout de 15 segundos para a conexão
            )
            # Ativa autocommit para evitar transações pendentes
            conn.set_session(autocommit=True)
            logger.info(f"Conexão com o banco de dados {DB_CONFIG['database']} estabelecida com sucesso.")
            return conn
        except psycopg2.OperationalError as e:
            logger.error(f"Erro operacional ao conectar ao banco de dados: {e}")
            return None
        except Exception as e:
            logger.error(f"Erro ao conectar ao banco de dados: {e}")
            return None
    
    def executar_com_retry(self, funcao, *args, max_retries=3, retry_delay=2):
        """
        Executa uma função com mecanismo de retry
        """
        for tentativa in range(1, max_retries + 1):
            try:
                # Verifica se a conexão está ativa
                if not self.conn or self.conn.closed:
                    logger.warning(f"Conexão fechada antes de executar {funcao.__name__}. Reconectando...")
                    self.conn = self.conectar()
                    if not self.conn:
                        logger.error("Falha ao reconectar ao banco de dados")
                        if tentativa == max_retries:
                            return None
                        time.sleep(retry_delay)
                        continue

                # Executa a função
                return funcao(*args)
            except psycopg2.OperationalError as e:
                logger.warning(f"Erro operacional na tentativa {tentativa} de {funcao.__name__}: {e}")
                if tentativa < max_retries:
                    logger.info(f"Tentando reconectar ao banco de dados...")
                    time.sleep(retry_delay)
                    self.conn = self.conectar()
                else:
                    logger.error(f"Todas as {max_retries} tentativas falharam para {funcao.__name__}")
                    return None
            except Exception as e:
                logger.error(f"Erro na execução de {funcao.__name__}: {e}")
                return None
    
    def criar_tabela_publicacoes(self):
        """Cria a tabela de publicações se ela não existir"""
        def _criar_tabela():
            try:
                with self.conn.cursor() as cursor:
                    # Primeiro, verifica se o schema public existe
                    cursor.execute("CREATE SCHEMA IF NOT EXISTS public")
                    
                    # Cria o enum de status se não existir
                    cursor.execute("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
                            CREATE TYPE status_enum AS ENUM ('nova', 'lida', 'enviada', 'processada');
                        END IF;
                    END
                    $$;
                    """)
                    
                    # Cria a tabela de publicações se não existir
                    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS publicacoes (
                        id SERIAL PRIMARY KEY,
                        numero_processo VARCHAR(50),
                        data_disponibilizacao DATE,
                        autor TEXT,
                        reu TEXT DEFAULT 'Instituto Nacional do Seguro Social - INSS',
                        advogado TEXT,
                        valor_principal DECIMAL(10, 2),
                        valor_juros_moratorios DECIMAL(10, 2),
                        honorarios_advocaticios DECIMAL(10, 2),
                        conteudo_completo TEXT,
                        status status_enum DEFAULT 'nova',
                        data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
                        data_atualizacao TIMESTAMP
                    )
                    """)
                    
                    logger.info("Tabela 'publicacoes' verificada/criada com sucesso.")
                    return True
            except Exception as e:
                logger.error(f"Erro ao criar tabela de publicações: {e}")
                return False
        
        return self.executar_com_retry(_criar_tabela)
    
    def verificar_publicacao_existente(self, numero_processo, data_disponibilizacao, conteudo_md5=None):
        """Verifica se uma publicação já existe no banco de dados"""
        def _verificar():
            try:
                with self.conn.cursor() as cursor:
                    # Se temos o número do processo e a data, verificamos por eles
                    if numero_processo and data_disponibilizacao:
                        query = """
                        SELECT id FROM publicacoes 
                        WHERE numero_processo = %s 
                        AND data_disponibilizacao = %s
                        """
                        cursor.execute(query, (numero_processo, data_disponibilizacao))
                        resultado = cursor.fetchone()
                        return resultado is not None
                    
                    # Se temos um hash do conteúdo, podemos verificar por ele
                    elif conteudo_md5:
                        query = """
                        SELECT id FROM publicacoes 
                        WHERE MD5(conteudo_completo) = %s
                        """
                        cursor.execute(query, (conteudo_md5,))
                        resultado = cursor.fetchone()
                        return resultado is not None
                    
                    return False
            except Exception as e:
                logger.error(f"Erro na verificação de publicação existente: {e}")
                return False
        
        return self.executar_com_retry(_verificar)
    
    def inserir_publicacao(self, publicacao):
        """Insere uma nova publicação no banco de dados"""
        def _inserir():
            try:
                # Verifica se a publicação já existe
                if publicacao.get('numero_processo') and publicacao.get('data_disponibilizacao'):
                    if self.verificar_publicacao_existente(
                        publicacao.get('numero_processo'), 
                        publicacao.get('data_disponibilizacao')
                    ):
                        logger.info(f"Publicação já existe no banco: Processo {publicacao.get('numero_processo')}")
                        return None
                
                # Log dos dados principais antes da inserção
                logger.debug(f"Inserindo publicação - Processo: {publicacao.get('numero_processo')}, "
                          f"Data: {publicacao.get('data_disponibilizacao')}")
                
                with self.conn.cursor() as cursor:
                    query = """
                    INSERT INTO publicacoes (
                        numero_processo, 
                        data_disponibilizacao, 
                        autor, 
                        reu, 
                        advogado, 
                        valor_principal,
                        valor_juros_moratorios, 
                        honorarios_advocaticios, 
                        conteudo_completo, 
                        status, 
                        data_criacao
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                    ) RETURNING id
                    """
                    
                    # Certifica-se de que a data é um objeto date
                    data = publicacao.get('data_disponibilizacao')
                    if isinstance(data, str):
                        try:
                            data = datetime.datetime.strptime(data, "%Y-%m-%d").date()
                        except:
                            try:
                                data = datetime.datetime.strptime(data, "%d/%m/%Y").date()
                            except:
                                logger.warning(f"Formato de data inválido: {data}. Usando data atual.")
                                data = datetime.date.today()
                    
                    # Limita o tamanho do conteúdo completo para evitar erros de tamanho máximo
                    conteudo_completo = publicacao.get('conteudo_completo', '')
                    if conteudo_completo and len(conteudo_completo) > 1000000:  # Limita a 1MB
                        conteudo_completo = conteudo_completo[:1000000] + "... (truncado)"
                        logger.warning(f"Conteúdo da publicação truncado por exceder tamanho máximo")
                    
                    # Prepara os valores para inserção
                    valores = (
                        publicacao.get('numero_processo'),
                        data,
                        publicacao.get('autor'),
                        publicacao.get('reu', "Instituto Nacional do Seguro Social - INSS"),
                        publicacao.get('advogado'),
                        publicacao.get('valor_principal'),
                        publicacao.get('valor_juros_moratorios'),
                        publicacao.get('honorarios_advocaticios'),
                        conteudo_completo,
                        'nova'
                    )
                    
                    # Log para debug
                    logger.debug(f"Executando query INSERT para processo {publicacao.get('numero_processo')}")
                    
                    # Executa a inserção
                    cursor.execute(query, valores)
                    id_publicacao = cursor.fetchone()[0]
                    
                    logger.info(f"Publicação inserida com sucesso: ID {id_publicacao}")
                    return id_publicacao
                    
            except Exception as e:
                logger.error(f"Erro ao inserir publicação: {e}")
                return None
        
        return self.executar_com_retry(_inserir)
    
    def executar_query(self, query, params=None):
        """Executa uma query genérica"""
        def _executar():
            try:
                with self.conn.cursor() as cursor:
                    cursor.execute(query, params)
                    return True
            except Exception as e:
                logger.error(f"Erro ao executar query: {e}")
                return False
        
        return self.executar_com_retry(_executar)
    
    def consultar_query(self, query, params=None):
        """Executa uma query de consulta e retorna os resultados"""
        def _consultar():
            try:
                with self.conn.cursor(cursor_factory=extras.DictCursor) as cursor:
                    cursor.execute(query, params)
                    return cursor.fetchall()
            except Exception as e:
                logger.error(f"Erro ao consultar: {e}")
                return []
        
        return self.executar_com_retry(_consultar)
    
    def limpar_conexoes_ociosas(self):
        """Limpa conexões ociosas no banco de dados"""
        try:
            if self.conn and not self.conn.closed:
                with self.conn.cursor() as cursor:
                    # Identifica conexões ociosas em transação
                    cursor.execute("""
                    SELECT pid, usename, datname, state, query, now() - query_start AS duration
                    FROM pg_stat_activity
                    WHERE state = 'idle in transaction'
                    AND datname = %s
                    AND now() - query_start > interval '5 minutes'
                    """, (DB_CONFIG['database'],))
                    
                    conexoes_ociosas = cursor.fetchall()
                    for conn in conexoes_ociosas:
                        pid = conn[0]
                        duracao = conn[5]
                        logger.warning(f"Terminando conexão ociosa {pid} (duração: {duracao})")
                        
                        try:
                            # Cancela a query e termina a conexão
                            cursor.execute("SELECT pg_terminate_backend(%s)", (pid,))
                        except:
                            pass
                    
                    if conexoes_ociosas:
                        logger.info(f"Terminadas {len(conexoes_ociosas)} conexões ociosas")
                    
                    return len(conexoes_ociosas)
        except Exception as e:
            logger.error(f"Erro ao limpar conexões ociosas: {e}")
            return 0
    
    def fechar_conexao(self):
        """Fecha a conexão com o banco de dados"""
        if self.conn and not self.conn.closed:
            try:
                self.conn.close()
                logger.info("Conexão com o banco de dados fechada.")
            except Exception as e:
                logger.error(f"Erro ao fechar conexão: {e}")

# Funções de compatibilidade com o código existente
def conectar_banco():
    """Função de compatibilidade - estabelece conexão com o banco de dados"""
    db = Database()
    return db.conn

def criar_tabela_publicacoes(conn):
    """Função de compatibilidade - cria a tabela de publicações"""
    db = Database()
    return db.criar_tabela_publicacoes()

def verificar_publicacao_existente(conn, numero_processo, data_disponibilizacao, conteudo_completo=None):
    """Função de compatibilidade - verifica se uma publicação já existe"""
    db = Database()
    db.conn = conn
    return db.verificar_publicacao_existente(numero_processo, data_disponibilizacao)

def salvar_publicacao(conn, publicacao):
    """Função de compatibilidade - salva uma nova publicação"""
    db = Database()
    db.conn = conn
    return db.inserir_publicacao(publicacao)

def verificar_banco_vazio(conn):
    """Verifica se o banco de dados está vazio (sem publicações)"""
    try:
        # Primeiro, tenta criar a tabela se ela não existir
        criar_tabela_publicacoes(conn)
        
        db = Database()
        db.conn = conn
        resultados = db.consultar_query("SELECT COUNT(*) FROM publicacoes")
        if resultados and len(resultados) > 0:
            return resultados[0][0] == 0
        return True
    except Exception as e:
        logger.error(f"Erro ao verificar se o banco está vazio: {e}")
        return True 