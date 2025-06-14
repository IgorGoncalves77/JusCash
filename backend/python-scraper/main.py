import schedule
import time
import datetime
import logging
import sys
import traceback
import platform
from scraper import DJEScraper
from database import conectar_banco, verificar_publicacao_existente, salvar_publicacao, verificar_banco_vazio, Database
from config import HORARIOS_EXECUCAO, eh_fim_de_semana

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("DJE_Scraper")

def limpar_conexoes_ociosas():
    """Limpa conexões ociosas do banco de dados"""
    try:
        logger.info("Verificando conexões ociosas no banco de dados...")
        db = Database()
        if db.conn:
            conexoes_limpas = db.limpar_conexoes_ociosas()
            if conexoes_limpas > 0:
                logger.info(f"Foram encerradas {conexoes_limpas} conexões ociosas no banco de dados")
            else:
                logger.info("Nenhuma conexão ociosa encontrada")
            db.fechar_conexao()
        else:
            logger.warning("Não foi possível conectar ao banco para verificar conexões ociosas")
    except Exception as e:
        logger.error(f"Erro ao limpar conexões ociosas: {e}")

def executar_scraping():
    """Função principal que executa o processo de web scraping"""
    logger.info("Iniciando processo de scraping do DJE...")
    logger.info(f"Sistema operacional: {platform.system()} {platform.release()} {platform.architecture()}")
    
    # Limpa conexões ociosas antes de iniciar
    limpar_conexoes_ociosas()
    
    # Verifica se é fim de semana
    hoje = datetime.date.today()
    if eh_fim_de_semana(hoje):
        logger.info(f"Hoje é fim de semana ({hoje.strftime('%d/%m/%Y')}). Pulando execução.")
        return
    
    # Conecta ao banco de dados
    conn = conectar_banco()
    if not conn:
        logger.error("Não foi possível conectar ao banco de dados. Abortando execução.")
        return
    
    # Verifica se é a primeira execução (banco vazio)
    primeira_execucao = verificar_banco_vazio(conn)
    logger.info(f"Primeira execução: {primeira_execucao}")
    
    # Inicializa o scraper
    scraper = None
    try:
        logger.info("Inicializando o scraper...")
        scraper = DJEScraper()
        logger.info("Scraper inicializado com sucesso.")
        
        # Busca as publicações
        logger.info("Iniciando busca de publicações...")
        publicacoes = scraper.buscar_publicacoes(primeira_execucao)
        logger.info(f"Encontradas {len(publicacoes)} publicações que atendem aos critérios.")
        
        # Processa e salva as publicações
        novas_publicacoes = 0
        for publicacao_item in publicacoes:
            # Processa a publicação
            publicacao = scraper.processar_publicacao(publicacao_item)
            
            if publicacao:
                # Verifica se publicacao é uma lista ou um único dicionário
                if isinstance(publicacao, list):
                    logger.info(f"Recebidos {len(publicacao)} processos válidos da publicação")
                    for proc in publicacao:
                        # Verifica se o processo já existe no banco
                        if not verificar_publicacao_existente(
                            conn, 
                            proc.get('numero_processo'), 
                            proc.get('data_disponibilizacao'),
                            proc.get('conteudo_completo')
                        ):
                            # Salva o novo processo
                            id_publicacao = salvar_publicacao(conn, proc)
                            if id_publicacao:
                                novas_publicacoes += 1
                                logger.info(f"Novo processo salvo com ID {id_publicacao}")
                else:
                    # Caso seja um único dicionário
                    # Verifica se a publicação já existe no banco
                    if not verificar_publicacao_existente(
                        conn, 
                        publicacao.get('numero_processo'), 
                        publicacao.get('data_disponibilizacao'),
                        publicacao.get('conteudo_completo')
                    ):
                        # Salva a nova publicação
                        id_publicacao = salvar_publicacao(conn, publicacao)
                        if id_publicacao:
                            novas_publicacoes += 1
                            logger.info(f"Nova publicação salva com ID {id_publicacao}")
        
        logger.info(f"Total de {novas_publicacoes} novas publicações salvas no banco de dados.")
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Erro durante o processo de scraping: {e}")
        
        # Trata especificamente o erro de tensores
        if "Attempting to use a delegate that only supports static-sized tensors with a graph that has dynamic-sized tensors" in error_msg:
            logger.warning("Detectado erro de tensores dinâmicos. Continuando com o processamento das publicações...")
            
            # Se o erro ocorrer e o scraper já foi inicializado, tenta processar as publicações encontradas
            if scraper:
                try:
                    # Busca links diretamente
                    resultados_publicacoes = scraper.extrair_links_publicacoes()
                    logger.info(f"Encontrados {len(resultados_publicacoes)} links de publicações após erro de tensores.")
                    
                    # Processa cada publicação
                    publicacoes = []
                    for resultado in resultados_publicacoes:
                        try:
                            # Se o snippet já contém ambas as palavras-chave, processa diretamente
                            if resultado['contem_rpv'] and resultado['contem_pagamento_inss']:
                                logger.info(f"Processando publicação com palavras-chave já confirmadas: {resultado['url']}")
                            
                            publicacao = scraper.processar_publicacao(resultado)
                            if publicacao:
                                # Verifica se publicacao é uma lista ou um único dicionário
                                if isinstance(publicacao, list):
                                    logger.info(f"Recebidos {len(publicacao)} processos válidos da publicação {resultado['url']}")
                                    for proc in publicacao:
                                        publicacoes.append(proc)
                                        
                                        # Verifica se o processo já existe no banco
                                        if not verificar_publicacao_existente(
                                            conn, 
                                            proc.get('numero_processo'), 
                                            proc.get('data_disponibilizacao'),
                                            proc.get('conteudo_completo')
                                        ):
                                            # Salva o novo processo
                                            id_publicacao = salvar_publicacao(conn, proc)
                                            if id_publicacao:
                                                logger.info(f"Novo processo salvo com ID {id_publicacao} após erro de tensores")
                                else:
                                    # Caso seja um único dicionário
                                    publicacoes.append(publicacao)
                                
                                # Verifica se a publicação já existe no banco
                                if not verificar_publicacao_existente(
                                    conn, 
                                    publicacao.get('numero_processo'), 
                                    publicacao.get('data_disponibilizacao'),
                                    publicacao.get('conteudo_completo')
                                ):
                                    # Salva a nova publicação
                                    id_publicacao = salvar_publicacao(conn, publicacao)
                                    if id_publicacao:
                                        logger.info(f"Nova publicação salva com ID {id_publicacao} após erro de tensores")
                        except Exception as pub_error:
                            logger.error(f"Erro ao processar publicação {resultado['url']}: {pub_error}")
                            continue
                except Exception as recovery_error:
                    logger.error(f"Erro durante a recuperação após erro de tensores: {recovery_error}")
        else:
            logger.error(f"Detalhes do erro: {traceback.format_exc()}")
    
    finally:
        # Fecha o scraper e a conexão com o banco de dados
        if scraper:
            try:
                scraper.fechar()
                logger.info("Scraper fechado com sucesso.")
            except Exception as e:
                logger.error(f"Erro ao fechar o scraper: {e}")
                
        if conn:
            try:
                conn.close()
                logger.info("Conexão com o banco de dados fechada.")
            except Exception as e:
                logger.error(f"Erro ao fechar conexão com o banco de dados: {e}")
    
    logger.info("Processo de scraping finalizado.")

def agendar_tarefas():
    """Agenda as tarefas para execução nos horários especificados"""
    logger.info("Configurando o agendamento das tarefas...")
    
    # Agenda para os horários especificados
    for horario in HORARIOS_EXECUCAO:
        schedule.every().day.at(horario).do(executar_scraping)
        logger.info(f"Tarefa agendada para execução diária às {horario}")
    
    # Agenda limpeza de conexões ociosas a cada 30 minutos
    schedule.every(30).minutes.do(limpar_conexoes_ociosas)
    logger.info("Tarefa de limpeza de conexões ociosas agendada para execução a cada 30 minutos")
    
    logger.info("Tarefas agendadas com sucesso.")

if __name__ == "__main__":
    logger.info("Iniciando aplicação de scraping do DJE...")
    
    try:
        # Executa o scraping uma vez ao iniciar a aplicação
        executar_scraping()
        
        # Configura o agendamento das tarefas
        agendar_tarefas()
        
        # Mantém a aplicação rodando, executando as tarefas agendadas
        logger.info("Aplicação em execução. Aguardando próximas tarefas agendadas...")
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Aplicação interrompida pelo usuário.")
    except Exception as e:
        logger.error(f"Erro não tratado na aplicação principal: {e}")
        logger.error(f"Detalhes: {traceback.format_exc()}")
        sys.exit(1) 