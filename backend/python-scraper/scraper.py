import time
import re
import datetime
import logging
from datetime import timedelta
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import requests
import os
import platform
import tempfile
import PyPDF2
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

from config import DJE_URL, CONSULTA_AVANCADA_URL, CADERNO, PALAVRAS_CHAVE, DIAS_PRIMEIRA_BUSCA, eh_fim_de_semana
from standalone_chrome import get_chromedriver_path

logger = logging.getLogger("DJE_Scraper")

class DJEScraper:
    def __init__(self):
        """Inicializa o scraper com um navegador Chrome headless"""
        chrome_options = Options()
        
        # Adiciona opção headless para execução em servidor
        if platform.system() != "Windows":  # Se não for Windows, ativa o modo headless
            chrome_options.add_argument("--headless=new")  # Modo headless moderno
        
        # Configurações adicionais importantes para Docker
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Para Docker/Linux, especifica onde o Chrome está instalado
        if platform.system() == "Linux":
            chrome_options.binary_location = "/usr/bin/google-chrome"
        
        # Adiciona um user agent para evitar detecção de headless
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36")
        
        # Adiciona opções para evitar detecção de automação
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option("useAutomationExtension", False)
        
        try:
            # Abordagem específica dependendo do sistema
            if platform.system() == "Windows":
                # No Windows, tenta usar o Chrome padrão ou nosso gerenciador personalizado
                driver_path = get_chromedriver_path()
                
                if driver_path and os.path.exists(driver_path):
                    logger.info(f"Usando ChromeDriver personalizado em: {driver_path}")
                    service = Service(executable_path=driver_path)
                    self.driver = webdriver.Chrome(service=service, options=chrome_options)
                else:
                    logger.info("Tentando usar o ChromeDriverManager no Windows...")
                    self.driver = webdriver.Chrome(options=chrome_options)
            else:
                # Em ambiente Docker/Linux, usar método explícito
                logger.info("Ambiente Linux detectado, usando configuração específica para Docker...")
                
                # Verificar se estamos em um container (geralmente presente em ambientes Docker)
                in_container = os.path.exists("/.dockerenv")
                logger.info(f"Executando em container Docker: {in_container}")
                
                if in_container:
                    # No Docker, usamos o Chrome que foi instalado pelo Dockerfile
                    # e o ChromeDriver compatível do webdriver_manager
                    from selenium.webdriver.chrome.service import Service as ChromeService
                    
                    self.driver = webdriver.Chrome(
                        service=ChromeService(ChromeDriverManager(path="/tmp/chromedriver").install()),
                        options=chrome_options
                    )
                else:
                    # Em um Linux não-Docker, tentar abordagem padrão
                    self.driver = webdriver.Chrome(
                        service=Service(ChromeDriverManager().install()), 
                        options=chrome_options
                    )
                
            # Configurações adicionais após inicialização
            self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
                """
            })
            
            self.wait = WebDriverWait(self.driver, 20)  # Aumentado para 20 segundos
            logger.info("Chrome inicializado com sucesso.")
            
        except Exception as e:
            logger.error(f"Erro ao inicializar o Chrome: {e}")
            logger.info("Tentando abordagem final de contingência...")
            
            try:
                # Tentativa final com configuração específica para containers Docker
                from selenium.webdriver.chrome.service import Service as ChromeService
                
                # Opções críticas para Docker
                chrome_options = Options()
                chrome_options.add_argument("--headless=new")
                chrome_options.add_argument("--no-sandbox")
                chrome_options.add_argument("--disable-dev-shm-usage")
                chrome_options.add_argument("--disable-gpu")
                
                # Configuração explícita para o webdriver_manager no Docker
                os.environ["WDM_LOG_LEVEL"] = "0"
                os.environ["WDM_PROGRESS_BAR"] = "0"
                os.environ["WDM_LOCAL"] = "1"
                os.environ["WDM_SSL_VERIFY"] = "0"
                os.environ["WDM_CACHE_PATH"] = "/tmp"
                
                # Usar Chrome já instalado pelo Dockerfile
                chrome_options.binary_location = "/usr/bin/google-chrome"
                
                # Criar instância do Chrome
                self.driver = webdriver.Chrome(options=chrome_options)
                
                self.wait = WebDriverWait(self.driver, 20)
                logger.info("Chrome inicializado com sucesso usando configuração de contingência.")
                
            except Exception as e2:
                logger.error(f"Erro na abordagem final: {e2}")
                raise Exception(f"Não foi possível inicializar o Chrome. Erro original: {e}. Erro final: {e2}")
    
    def fechar(self):
        """Fecha o navegador"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Navegador Chrome fechado com sucesso.")
            except Exception as e:
                logger.error(f"Erro ao fechar o navegador Chrome: {e}")
    
    def acessar_consulta_avancada(self):
        """Acessa a página de consulta avançada do DJE"""
        try:
            # Acessa diretamente a URL de consulta avançada com #buscaavancada
            logger.info(f"Acessando diretamente a URL de consulta avançada: {CONSULTA_AVANCADA_URL}")
            self.driver.get(CONSULTA_AVANCADA_URL)
            
            # Espera mais tempo para garantir carregamento completo
            time.sleep(5)
            
            # Força JavaScript para garantir que estamos na seção correta
            self.driver.execute_script("window.location.hash = '#buscaavancada';")
            time.sleep(2)
            
            # Verifica se estamos na página de consulta avançada
            if "consultaAvancada.do" in self.driver.current_url:
                logger.info("Página de consulta avançada acessada diretamente com sucesso.")
                return True
            else:
                logger.error("Não foi possível acessar a página de consulta avançada.")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao acessar consulta avançada: {e}")
            return False
    
    def selecionar_datas(self, data_inicial, data_final):
        """Seleciona o intervalo de datas para a pesquisa"""
        try:
            # Formata as datas no padrão DD/MM/AAAA
            data_inicial_str = data_inicial.strftime("%d/%m/%Y")
            data_final_str = data_final.strftime("%d/%m/%Y")
            
            logger.info(f"Selecionando datas: {data_inicial_str} a {data_final_str}")
            
            # Usa os nomes corretos dos campos fornecidos
            try:
                campo_data_inicial = self.driver.find_element(By.NAME, "dadosConsulta.dtInicio")
                campo_data_final = self.driver.find_element(By.NAME, "dadosConsulta.dtFim")
                
                # Limpa e preenche os campos
                campo_data_inicial.clear()
                campo_data_inicial.send_keys(data_inicial_str)
                time.sleep(1)
                
                campo_data_final.clear()
                campo_data_final.send_keys(data_final_str)
                time.sleep(1)
                
                logger.info("Datas preenchidas com sucesso.")
                return True
            except NoSuchElementException as e:
                logger.error(f"Erro ao encontrar campos de data: {e}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao selecionar datas: {e}")
            return False
    
    def selecionar_caderno(self, caderno):
        """Seleciona o caderno específico para a pesquisa"""
        try:
            logger.info(f"Selecionando caderno: {caderno}")
            
            # Usa o nome correto do campo fornecido
            try:
                select_element = self.driver.find_element(By.NAME, "dadosConsulta.cdCaderno")
                
                # Seleciona diretamente o valor 12 para o caderno desejado
                select_caderno = Select(select_element)
                select_caderno.select_by_value("12")
                
                logger.info("Caderno selecionado com sucesso usando o value=12")
                time.sleep(1)
                return True
            except NoSuchElementException as e:
                logger.error(f"Erro ao encontrar select de caderno: {e}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao selecionar caderno: {e}")
            return False
    
    def preencher_palavras_chave(self, palavras_chave):
        """Preenche o campo de palavras-chave para a pesquisa"""
        try:
            # Formata as palavras-chave no formato esperado pelo site
            palavras_str = '"RPV" e "pagamento pelo INSS"'
            logger.info(f"Preenchendo palavras-chave: {palavras_str}")
            
            # Usa o nome correto do campo fornecido
            try:
                campo_palavras = self.driver.find_element(By.NAME, "dadosConsulta.pesquisaLivre")
                
                # Limpa e preenche o campo
                campo_palavras.clear()
                campo_palavras.send_keys(palavras_str)
                time.sleep(1)
                
                logger.info("Palavras-chave preenchidas com sucesso")
                return True
            except NoSuchElementException as e:
                logger.error(f"Erro ao encontrar campo de palavras-chave: {e}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao preencher palavras-chave: {e}")
            return False
    
    def executar_pesquisa(self):
        """Clica no botão de pesquisa e aguarda os resultados"""
        try:
            logger.info("Executando pesquisa...")
            
            # Usa o nome correto do botão fornecido
            try:
                botao_pesquisar = self.driver.find_element(By.NAME, "Pesquisar")
                
                # Clica no botão de pesquisa
                botao_pesquisar.click()
                logger.info("Botão de pesquisa clicado, aguardando resultados...")
                
                # Aguarda o carregamento dos resultados (um tempo maior para garantir)
                time.sleep(10)
                
                # Verifica se ainda estamos na mesma página ou se a página mudou
                if "consultaAvancada.do" in self.driver.current_url and "#buscaavancada" in self.driver.current_url:
                    # Tenta encontrar mensagem de resultado ou tabela
                    try:
                        mensagem = self.driver.find_element(By.XPATH, "//div[contains(text(), 'Não foi encontrado')]")
                        logger.info(f"Mensagem encontrada: {mensagem.text}")
                        return True  # Pesquisa realizada, mas sem resultados
                    except:
                        logger.warning("Ainda na página de pesquisa, verificando se há resultados...")
                
                return True
            except NoSuchElementException as e:
                logger.error(f"Erro ao encontrar botão de pesquisa: {e}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao executar pesquisa: {e}")
            return False
    
    def extrair_links_publicacoes(self):
        """Extrai os links para as publicações encontradas na pesquisa, junto com seus snippets de texto"""
        try:
            logger.info("Extraindo links das publicações...")
            
            # Estrutura para armazenar URLs e snippets
            resultado_links = []
            base_url = "https://dje.tjsp.jus.br"
            
            # Processa todas as páginas de resultados
            pagina_atual = 1
            tem_proxima_pagina = True
            
            while tem_proxima_pagina:
                logger.info(f"Processando página de resultados {pagina_atual}")
                
                try:
                    # Procura a div com os resultados
                    div_resultados = self.driver.find_element(By.ID, "divResultadosInferior")
                    logger.info("Div de resultados encontrada com sucesso")
                    
                    # Encontra todas as linhas da tabela (cada item de resultado)
                    linhas = div_resultados.find_elements(By.CLASS_NAME, "fundocinza1")
                    logger.info(f"Encontradas {len(linhas)} linhas de resultados na página {pagina_atual}")
                    
                    # Processa cada linha de resultado
                    for linha in linhas:
                        try:
                            # Busca o link dentro da linha
                            links_popup = linha.find_elements(By.XPATH, ".//a[contains(@onclick, 'popup')]")
                            
                            if links_popup:
                                # Obtém o atributo onclick do primeiro link
                                onclick = links_popup[0].get_attribute("onclick")
                                
                                if onclick and "popup('" in onclick:
                                    # Extrai o caminho entre aspas simples
                                    match = re.search(r"popup\('([^']+)'\)", onclick)
                                    if match:
                                        caminho = match.group(1)
                                        url_completa = base_url + caminho
                                        
                                        # Busca o snippet de texto
                                        snippet_elem = linha.find_element(By.CLASS_NAME, "ementaClass2")
                                        snippet = snippet_elem.text.strip() if snippet_elem else ""
                                        
                                        # Verifica palavras-chave no snippet
                                        contem_rpv = re.search(r'\brpv\b', snippet, re.IGNORECASE) is not None
                                        
                                        # Busca por variações de "pagamento pelo INSS" no snippet
                                        padroes_pagamento_inss = [
                                            r'pagamento\s+pelo\s+inss',
                                            r'inss\s+.{0,30}?\s+pagamento',
                                            r'pagamento\s+.{0,30}?\s+inss',
                                            r'inss\s+.{0,30}?\s+efetuar\s+.{0,10}?\s+pagamento',
                                            r'inss\s+.{0,30}?\s+realizar\s+.{0,10}?\s+pagamento'
                                        ]
                                        
                                        contem_pagamento_inss = False
                                        for padrao in padroes_pagamento_inss:
                                            if re.search(padrao, snippet, re.IGNORECASE):
                                                contem_pagamento_inss = True
                                                break
                                                
                                        # Adiciona à lista de resultados (evitando duplicações)
                                        url_ja_existe = any(item['url'] == url_completa for item in resultado_links)
                                        
                                        if not url_ja_existe:
                                            resultado_links.append({
                                                'url': url_completa,
                                                'snippet': snippet,
                                                'contem_rpv': contem_rpv,
                                                'contem_pagamento_inss': contem_pagamento_inss
                                            })
                                            
                                            logger.info(f"URL extraída com snippet: {url_completa}")
                                            if contem_rpv and contem_pagamento_inss:
                                                logger.info(f"Snippet JÁ CONTÉM ambas as palavras-chave: RPV e pagamento pelo INSS")
                        
                        except Exception as e:
                            logger.error(f"Erro ao processar linha de resultado: {e}")
                    
                    # Verifica se há mais páginas e navega para a próxima
                    tem_proxima_pagina = False
                    try:
                        # Procura o link "Próximo>"
                        links_paginacao = self.driver.find_elements(By.XPATH, "//a[contains(text(), 'Próximo') or contains(text(), 'Próximo>')]")
                        
                        if links_paginacao:
                            # Clica no link da próxima página
                            links_paginacao[0].click()
                            logger.info(f"Navegando para a próxima página de resultados")
                            
                            # Aguarda o carregamento da nova página
                            time.sleep(5)
                            
                            # Incrementa o contador de páginas
                            pagina_atual += 1
                            tem_proxima_pagina = True
                        else:
                            logger.info("Não foram encontrados mais links de paginação")
                    except Exception as e:
                        logger.error(f"Erro ao navegar para a próxima página: {e}")
                        tem_proxima_pagina = False
                
                except NoSuchElementException as e:
                    logger.warning(f"Div 'divResultadosInferior' não encontrada na página {pagina_atual}: {e}")
                    tem_proxima_pagina = False
                    
                    # Se não encontrou resultados na primeira página, tenta abordagens alternativas
                    if pagina_atual == 1:
                        logger.info("Tentando abordagens alternativas para encontrar links")
                        
                        # Tenta encontrar links diretamente na página
                        links_onclick = self.driver.find_elements(By.XPATH, "//a[contains(@onclick, 'popup')]")
                        
                        for link in links_onclick:
                            try:
                                onclick = link.get_attribute("onclick")
                                if onclick and "popup('" in onclick:
                                    match = re.search(r"popup\('([^']+)'\)", onclick)
                                    if match:
                                        caminho = match.group(1)
                                        url_completa = base_url + caminho
                                        
                                        # Tenta encontrar texto próximo ao link
                                        parent = link.find_element(By.XPATH, ".//..")
                                        snippet = parent.text if parent else ""
                                        
                                        resultado_links.append({
                                            'url': url_completa,
                                            'snippet': snippet,
                                            'contem_rpv': "rpv" in snippet.lower(),
                                            'contem_pagamento_inss': "pagamento" in snippet.lower() and "inss" in snippet.lower()
                                        })
                                        
                                        logger.info(f"URL alternativa encontrada: {url_completa}")
                            except Exception as link_error:
                                logger.error(f"Erro ao processar link alternativo: {link_error}")
                
                except Exception as e:
                    logger.error(f"Erro ao processar página {pagina_atual}: {e}")
                    tem_proxima_pagina = False
            
            logger.info(f"Total de {len(resultado_links)} links com snippets extraídos de todas as páginas")
            return resultado_links
            
        except Exception as e:
            logger.error(f"Erro ao extrair links das publicações: {e}")
            return []
    
    def salvar_html_pagina(self, nome_arquivo):
        """Função vazia para compatibilidade, não salva mais HTML"""
        return None
    
    def processar_publicacao(self, publicacao_item):
        """Processa uma publicação para extrair dados relevantes"""
        try:
            # Verifica se temos o URL da publicação
            url_publicacao = publicacao_item.get('url')
            if not url_publicacao:
                logger.warning("URL da publicação não fornecido")
                return None
            
            logger.info(f"Acessando página de publicação: {url_publicacao}")
            
            # ABORDAGEM 1: Sempre tentar primeiro baixar o PDF diretamente
            # Esta abordagem evita problemas com iframes e restrições de segurança
            try:
                # Construir a URL direta do PDF
                # Exemplo: consultaSimples.do?cdVolume=19&nuDiario=4199&cdCaderno=12&nuSeqpagina=3572
                # Para: getPaginaDoDiario.do?cdVolume=19&nuDiario=4199&cdCaderno=12&nuSeqpagina=3572
                url_pdf = url_publicacao.replace("consultaSimples.do", "getPaginaDoDiario.do")
                logger.info(f"URL direta para o PDF construída: {url_pdf}")
                
                # Baixa e extrai o PDF diretamente
                texto_completo = self.baixar_e_extrair_pdf_direto(url_pdf)
                
                if texto_completo and len(texto_completo) > 50:
                    logger.info(f"Texto extraído com sucesso do PDF via download direto ({len(texto_completo)} caracteres)")
                    # Continua com o processamento
                else:
                    logger.warning("Não foi possível extrair texto do PDF via download direto")
                    # Tenta o método alternativo
                    texto_completo = None
            except Exception as e:
                logger.error(f"Erro ao baixar/extrair PDF diretamente: {e}")
                texto_completo = None
            
            # Se não conseguiu extrair via download direto, tenta os métodos antigos
            if not texto_completo:
                # ABORDAGEM 2: Tenta extrair conteúdo usando método antigo (iframe)
                try:
                    texto_completo = self.extrair_conteudo_iframe(url_publicacao)
                    if texto_completo and len(texto_completo) > 50:
                        logger.info(f"Texto extraído com sucesso via método iframe ({len(texto_completo)} caracteres)")
                    else:
                        logger.warning("Não foi possível extrair texto via método iframe")
                except Exception as e:
                    logger.error(f"Erro ao extrair texto via método iframe: {e}")
                    texto_completo = None
                
                # ABORDAGEM 3: Se ainda não tiver texto, tenta acessar a página diretamente
                if not texto_completo:
                    try:
                        self.driver.get(url_publicacao)
                        time.sleep(3)  # Espera para carregar
                        
                        processos_validos = self.processar_pagina_completa()
                        if processos_validos:
                            # Se encontrou processos válidos, retorna eles
                            resultados = []
                            for processo_texto in processos_validos:
                                dados_processo = self._extrair_dados_processo(processo_texto)
                                if dados_processo:
                                    resultados.append(dados_processo)
                                    
                            # Retorna os resultados
                            if len(resultados) == 1:
                                return resultados[0]
                            elif resultados:
                                return resultados
                            # Removido return None para permitir seguir para outras abordagens
                        
                        # Se não encontrou processos válidos, desiste
                        logger.warning("Nenhum processo válido encontrado na página")
                        
                        # Último recurso: tentar usar o snippet
                        snippet = publicacao_item.get('snippet', '')
                        if "RPV" in snippet and "pagamento pelo INSS" in snippet:
                            logger.info("Verificando se o snippet contém informações válidas...")
                            dados_snippet = self._extrair_dados_processo(snippet)
                            if dados_snippet:
                                return dados_snippet
                        
                        return None
                    except Exception as e:
                        logger.error(f"Erro ao processar página completa: {e}")
                        texto_completo = None
                
                # Se depois de todas as tentativas ainda não tiver texto, desiste
                if not texto_completo:
                    logger.error("Não foi possível extrair texto por nenhum método")
                    return None
            
            # Aqui temos o texto completo do PDF, agora vamos processá-lo
            # Primeiro verificamos se há processos incompletos
            tem_processo_incompleto = self.verificar_processo_incompleto(texto_completo)
            
            # Se houver processo incompleto, precisamos tentar acessar a próxima página
            if tem_processo_incompleto:
                logger.info("Detectado processo incompleto no texto. Tentando acessar a próxima página...")
                
                # Construir a URL da próxima página
                # Extrair parâmetros da URL atual
                params_match = re.search(r'cdVolume=(\d+)&nuDiario=(\d+)&cdCaderno=(\d+)&nuSeqpagina=(\d+)', url_publicacao)
                
                if params_match:
                    cd_volume = params_match.group(1)
                    nu_diario = params_match.group(2)
                    cd_caderno = params_match.group(3)
                    nu_seqpagina = int(params_match.group(4))
                    
                    # Incrementa o número da página
                    proxima_pagina = nu_seqpagina + 1
                    
                    # Constrói a URL da próxima página
                    url_proxima = f"https://dje.tjsp.jus.br/cdje/consultaSimples.do?cdVolume={cd_volume}&nuDiario={nu_diario}&cdCaderno={cd_caderno}&nuSeqpagina={proxima_pagina}"
                    logger.info(f"URL da próxima página: {url_proxima}")
                    
                    # Acessa a próxima página
                    try:
                        self.driver.get(url_proxima)
                        time.sleep(3)  # Espera para carregar
                        
                        # Tenta extrair o PDF da próxima página
                        url_pdf_proxima = url_proxima.replace("consultaSimples.do", "getPaginaDoDiario.do")
                        texto_proxima_pagina = self.baixar_e_extrair_pdf_direto(url_pdf_proxima)
                        
                        if texto_proxima_pagina and len(texto_proxima_pagina) > 50:
                            logger.info(f"Texto da próxima página extraído com sucesso ({len(texto_proxima_pagina)} caracteres)")
                            
                            # Extrai o último processo incompleto
                            ultima_ocorrencia = texto_completo.rfind("Processo")
                            if ultima_ocorrencia != -1:
                                processo_incompleto = texto_completo[ultima_ocorrencia:]
                                
                                # Procura a continuação na próxima página
                                primeiro_processo = texto_proxima_pagina.find("Processo")
                                
                                if primeiro_processo > 0:
                                    # Há conteúdo antes do primeiro "Processo" na próxima página
                                    continuacao = texto_proxima_pagina[:primeiro_processo].strip()
                                    
                                    # Concatena o processo incompleto com sua continuação
                                    processo_completo = processo_incompleto + " " + continuacao
                                    
                                    # Substitui o processo incompleto no texto original
                                    texto_completo = texto_completo[:ultima_ocorrencia] + processo_completo
                                    
                                    # Adiciona o restante do texto da próxima página
                                    texto_completo += " " + texto_proxima_pagina[primeiro_processo:]
                                    
                                    logger.info("Texto das duas páginas concatenado com sucesso")
                    except Exception as e:
                        logger.error(f"Erro ao acessar próxima página: {e}")
            
            # Agora processa o texto completo (potencialmente concatenado de múltiplas páginas)
            # Divide o texto em processos individuais
            processos = re.findall(r'(Processo.*?ADV:.*?\(OAB.*?\))', texto_completo, re.DOTALL)
            logger.info(f"Encontrados {len(processos)} processos no texto")
            
            if not processos:
                logger.warning("Nenhum processo encontrado no texto")
                return None
            
            # Filtra os processos que contêm as palavras-chave
            processos_validos = []
            for processo in processos:
                if "RPV" in processo and "pagamento pelo INSS" in processo:
                    processos_validos.append(processo)
            
            logger.info(f"Encontrados {len(processos_validos)} processos válidos com as palavras-chave")
            
            if not processos_validos:
                logger.warning("Nenhum processo válido encontrado (com RPV e pagamento pelo INSS)")
                return None
            
            # Processa cada processo válido
            resultados = []
            for processo_texto in processos_validos:
                dados_processo = self._extrair_dados_processo(processo_texto)
                if dados_processo:
                    resultados.append(dados_processo)
            
            # Retorna os resultados
            if len(resultados) == 1:
                return resultados[0]
            elif resultados:
                return resultados
            else:
                return None
            
        except Exception as e:
            logger.error(f"Erro ao processar publicação: {e}")
            return None
    
    def baixar_e_extrair_pdf_direto(self, url_pdf):
        """Baixa e extrai texto de um PDF diretamente da URL"""
        try:
            logger.info(f"Baixando PDF diretamente da URL: {url_pdf}")
            
            # Usar session com cookies do Selenium para manter autenticação
            session = requests.Session()
            
            # Adiciona cookies do Selenium à sessão
            cookies = self.driver.get_cookies()
            if cookies:
                logger.info(f"Adicionados {len(cookies)} cookies do Selenium à sessão")
                for cookie in cookies:
                    session.cookies.set(cookie['name'], cookie['value'])
            
            # Acessa a página inicial para garantir que temos todos os cookies
            initial_response = session.get("https://dje.tjsp.jus.br/cdje/index.do")
            logger.info("Acessada página inicial para obter cookies de sessão")
            
            # Faz a requisição para o PDF
            logger.info("Fazendo requisição para o PDF...")
            response = session.get(url_pdf, stream=True, timeout=30)
            
            # Verifica se o PDF foi baixado com sucesso
            if response.status_code != 200:
                logger.error(f"Erro ao baixar PDF: Status {response.status_code}")
                return None
            
            # Verifica se o conteúdo é realmente um PDF
            if not response.content.startswith(b'%PDF'):
                # Se não for PDF, verifica se é uma página de erro ou login
                if b'<html' in response.content[:100]:
                    logger.error("Recebido HTML ao invés de PDF, possível erro de autenticação")
                    soup = BeautifulSoup(response.content, 'html.parser')
                    error_text = soup.get_text()
                    logger.error(f"Texto do erro: {error_text[:200]}...")
                    return None
                else:
                    logger.error("Conteúdo recebido não é PDF nem HTML")
                    return None
            
            logger.info("Conteúdo PDF válido recebido")
            
            # Salva o PDF temporariamente
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                temp_path = temp_file.name
                temp_file.write(response.content)
            
            logger.info(f"PDF salvo temporariamente em: {temp_path}")
            
            # Extrai o texto do PDF
            try:
                # Método 1: Usar PyPDF2
                texto_completo = ""
                with open(temp_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    num_paginas = len(reader.pages)
                    
                    logger.info(f"Extraindo texto de {num_paginas} páginas com PyPDF2")
                    
                    for i in range(num_paginas):
                        page = reader.pages[i]
                        texto_pagina = page.extract_text()
                        
                        if texto_pagina:
                            texto_completo += texto_pagina + "\n\n"
                    
                    if texto_completo and len(texto_completo) > 50:
                        logger.info(f"Texto extraído com PyPDF2: {len(texto_completo)} caracteres")
                        
                        # Limpeza do arquivo temporário
                        try:
                            os.unlink(temp_path)
                        except Exception as e:
                            logger.warning(f"Erro ao remover arquivo temporário: {e}")
                            
                        return texto_completo
                    else:
                        logger.warning("PyPDF2 extraiu texto insuficiente, tentando método alternativo")
                
                # Método 2: pdfminer.six (geralmente mais preciso, mas mais lento)
                try:
                    from pdfminer.high_level import extract_text
                    
                    logger.info("Tentando extrair texto com pdfminer.six")
                    texto_pdfminer = extract_text(temp_path)
                    
                    if texto_pdfminer and len(texto_pdfminer) > 50:
                        logger.info(f"Texto extraído com pdfminer.six: {len(texto_pdfminer)} caracteres")
                        
                        # Limpeza do arquivo temporário
                        try:
                            os.unlink(temp_path)
                        except Exception as e:
                            logger.warning(f"Erro ao remover arquivo temporário: {e}")
                            
                        return texto_pdfminer
                    else:
                        logger.warning("pdfminer.six extraiu texto insuficiente")
                except ImportError:
                    logger.warning("pdfminer.six não está instalado")
                except Exception as e:
                    logger.warning(f"Erro ao extrair texto com pdfminer.six: {e}")
                
                # Limpa o arquivo temporário se chegou aqui
                try:
                    os.unlink(temp_path)
                except Exception as e:
                    logger.warning(f"Erro ao remover arquivo temporário: {e}")
                
                # Se chegou aqui, nenhum método funcionou
                logger.error("Não foi possível extrair texto do PDF")
                return None
                
            except Exception as e:
                logger.error(f"Erro ao processar o PDF: {e}")
                
                # Tenta limpar o arquivo temporário mesmo em caso de erro
                try:
                    os.unlink(temp_path)
                except Exception as cleanup_error:
                    logger.warning(f"Erro ao remover arquivo temporário: {cleanup_error}")
                
                return None
                
        except Exception as e:
            logger.error(f"Erro ao baixar e extrair PDF direto: {e}")
            return None
    
    def _extrair_dados_processo(self, processo_texto):
        """Extrai todos os dados de um processo individual"""
        try:
            # Cria um dicionário para armazenar os dados extraídos
            dados_processo = {
                'conteudo_completo': processo_texto,
                'data_disponibilizacao': datetime.date.today().strftime("%Y-%m-%d")
            }
            
            # Pré-processamento do texto para facilitar extração
            texto_processado = processo_texto.replace('\n', ' ').replace('\r', ' ')
            texto_processado = re.sub(r'\s+', ' ', texto_processado)
            
            # EXTRAÇÃO DO NÚMERO DO PROCESSO
            numero_processo = None
            
            # Lista de padrões para encontrar o número do processo em diferentes formatos
            padroes_processo = [
                # Formato CNJ completo
                r'\b(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})\b',
                # Processo com formato específico
                r'Processo\s+(\d+[-./]\d+[^-\s]*)',
                # Outros formatos comuns
                r'[Pp]rocesso\s+[Nn][º°]?\s*:\s*(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})',
                r'[Pp]rocesso\s+[Nn][º°]?\s*[.:]\s*(\d{20})',
                r'[Pp]rocesso\s+(\d{20})',
                # Outros formatos comuns
                r'[Pp]rocesso\s+[Nn][º°]?\s*[.:]\s*(\d+[-./]\d+[-./]\d+)',
                r'[Pp]rocesso\s+[Nn][º°]?\s*[.:]\s*(\d+[-./]\d+)',
                r'[Pp]rocesso\s+[Nn][º°]?\s*[.:]\s*(\d+)',
                # Busca genérica
                r'(?:Autos|Número|Numeração)[^:]*:\s*(\d+[-./]?\d*[-./]?\d*[-./]?\d*[-./]?\d*)',
                # Busca por padrões em tabelas/formatação espaçada
                r'Processo\s+[^\n]*?(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})',
                r'\b(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})\b'
            ]
            
            for padrao in padroes_processo:
                processo_match = re.search(padrao, texto_processado)
                if processo_match:
                    numero_processo = processo_match.group(1).strip()
                    # Remove possíveis pontos e traços extras
                    numero_processo = re.sub(r'\s+', '', numero_processo)
                    logger.info(f"Número do processo extraído: {numero_processo}")
                    break
            
            dados_processo['numero_processo'] = numero_processo
            
            # EXTRAÇÃO DO AUTOR - REGRA: nome que antecede "- Vistos."
            autor = None
            
            # Padrão principal: o último nome antes de "- Vistos."
            autor_match = re.search(r'(?:Permanent[e]|Espécie|Acidente|Fazenda Pública|Art\. 86|\))?\s*-\s*([^-]+?)\s+-\s+Vistos', texto_processado)
            if autor_match:
                autor = autor_match.group(1).strip()
                logger.info(f"Autor extraído (antes de '- Vistos'): {autor}")
            else:
                # Tenta outro padrão comum em vários documentos - nome após o tipo do processo
                padrao_tipo_processo = r'Processo\s+\d+[-./\d\s()]+(?: - [^-]+){1,3} - ([^-]+) -'
                autor_match = re.search(padrao_tipo_processo, texto_processado)
                if autor_match:
                    autor = autor_match.group(1).strip()
                    logger.info(f"Autor extraído (após tipo do processo): {autor}")
                else:
                    # Busca por padrões comuns de Auxílio-Acidente ou Benefícios em Espécie
                    padroes_tipo_processo = [
                        r'(?:Auxílio-Acidente|Benefícios em Espécie|Procedimento Comum)\s*\([^)]*\)\s*-\s*([^-]+?)\s*-\s*Vistos',
                        r'(?:Auxílio-Acidente|Benefícios em Espécie|Incapacidade Laborativa)\s*(?:Permanent[e])?(?:\([^)]*\))?\s*-\s*([^-]+?)\s*-\s*Vistos',
                        r'\([^)]*Art\.\s*86[^)]*\)\s*-\s*([^-]+?)\s*-\s*Vistos'
                    ]
                    
                    for padrao in padroes_tipo_processo:
                        autor_match = re.search(padrao, texto_processado, re.IGNORECASE)
                        if autor_match:
                            autor_extraido = autor_match.group(1).strip()
                            if autor_extraido and len(autor_extraido) > 3 and not re.search(r'^(INSS|Instituto Nacional)', autor_extraido, re.IGNORECASE):
                                autor = autor_extraido
                                logger.info(f"Autor extraído (entre tipo e Vistos): {autor}")
                                break
            
            # Verificação final para garantir que não pegou texto errado
            if autor and (len(autor) > 50 or len(autor) < 3 or 
                         re.search(r'outorgando poderes|advogado|advocacia|requisição|crédito|despacho|decisão', autor, re.IGNORECASE)):
                autor = None
                logger.warning("Autor extraído parece inválido, ignorando")
                
                # Tenta um último método mais simples
                partes = texto_processado.split(' - ')
                for i, parte in enumerate(partes):
                    if i > 0 and i < len(partes)-1 and 'Vistos' in partes[i+1]:
                        autor_candidato = parte.strip()
                        if len(autor_candidato) > 3 and len(autor_candidato) < 50:
                            autor = autor_candidato
                            logger.info(f"Autor extraído (método simples): {autor}")
                            break
            
            dados_processo['autor'] = autor
            
            # EXTRAÇÃO DO ADVOGADO - ABORDAGEM MELHORADA PARA MÚLTIPLOS ADVOGADOS
            advogados_encontrados = []
            
            # Expressão regular para o formato "ADV: NOME (OAB NÚMERO/UF)" com captura da OAB
            advogado_matches = re.finditer(r'ADV:\s+([^(]+)\s*(\(OAB [^)]+\))', texto_processado, re.IGNORECASE)
            for match in advogado_matches:
                nome_advogado = match.group(1).strip()
                oab_texto = match.group(2).strip()
                advogado_texto = f"{nome_advogado} {oab_texto}"
                
                # Processa o texto para tratar casos de múltiplos advogados
                # Verifica se há vírgulas ou " E " no texto, indicando múltiplos advogados
                if ',' in advogado_texto or ' E ' in advogado_texto.upper():
                    # Divide por vírgula ou " E "
                    adv_parts = re.split(r',\s*|\s+[eE]\s+', advogado_texto)
                    for adv_part in adv_parts:
                        adv_part = adv_part.strip()
                        if adv_part and len(adv_part) > 3:
                            # Limpa o texto
                            adv_part = re.sub(r'\s+', ' ', adv_part).strip()
                            # Evita duplicação
                            if adv_part not in advogados_encontrados:
                                advogados_encontrados.append(adv_part)
                                logger.info(f"Advogado extraído (múltiplo): {adv_part}")
                else:
                    # Advogado único
                    if advogado_texto and len(advogado_texto) > 3:
                        # Limpa o texto extraído
                        advogado_texto = re.sub(r'\s+', ' ', advogado_texto).strip()
                        # Evita duplicação
                        if advogado_texto not in advogados_encontrados:
                            advogados_encontrados.append(advogado_texto)
                            logger.info(f"Advogado extraído: {advogado_texto}")
            
            # Tenta uma expressão alternativa se não encontrou advogados
            if not advogados_encontrados:
                padrao_alternativo = r'- ADV:\s+([^(]+)\s*(\(OAB [^)]+\))'
                advogado_matches = re.finditer(padrao_alternativo, texto_processado, re.IGNORECASE)
                for match in advogado_matches:
                    nome_advogado = match.group(1).strip()
                    oab_texto = match.group(2).strip()
                    advogado_texto = f"{nome_advogado} {oab_texto}"
                    
                    # Processa para múltiplos advogados
                    if ',' in advogado_texto or ' E ' in advogado_texto.upper():
                        adv_parts = re.split(r',\s*|\s+[eE]\s+', advogado_texto)
                        for adv_part in adv_parts:
                            adv_part = adv_part.strip()
                            if adv_part and len(adv_part) > 3:
                                adv_part = re.sub(r'\s+', ' ', adv_part).strip()
                                if adv_part not in advogados_encontrados:
                                    advogados_encontrados.append(adv_part)
                                    logger.info(f"Advogado extraído (alt-múltiplo): {adv_part}")
                    else:
                        if advogado_texto and len(advogado_texto) > 3:
                            advogado_texto = re.sub(r'\s+', ' ', advogado_texto).strip()
                            if advogado_texto not in advogados_encontrados:
                                advogados_encontrados.append(advogado_texto)
                                logger.info(f"Advogado extraído (alt): {advogado_texto}")
            
            # Combina múltiplos advogados se encontrados
            advogado = "; ".join(advogados_encontrados) if advogados_encontrados else None
            dados_processo['advogado'] = advogado
            
            # EXTRAÇÃO DE VALORES MONETÁRIOS COM NOVAS REGRAS
            
            # Primeiro, procura por toda a seção de valores após "homologo os cálculos" até o final do parágrafo
            secao_valores = None
            valores_match = re.search(r'homologo os cálculos[^.]*correspondem ao[^R$]*(.+?)(?=\.\s*Os valores)', texto_processado, re.IGNORECASE | re.DOTALL)
            if valores_match:
                secao_valores = valores_match.group(1).strip()
                logger.info(f"Seção de valores encontrada: {secao_valores}")
            
            # Valor principal
            valor_principal = None
            if secao_valores:
                # Procura por "R$ X - principal bruto/líquido" na seção de valores
                valor_match = re.search(r'R\$\s*([0-9.,]+)[^;,]*(?:principal\s*bruto(?:/líquido)?|bruto/líquido)', secao_valores, re.IGNORECASE)
                if valor_match:
                    valor_str = valor_match.group(1).strip()
                    valor_str = self._limpar_valor_monetario(valor_str)
                    valor_principal = float(valor_str) if valor_str else None
                    logger.info(f"Valor principal bruto/líquido extraído: {valor_principal}")
            
            # Se não encontrou na seção específica, tenta no texto completo
            if not valor_principal:
                valor_match = re.search(r'R\$\s*([0-9.,]+)[^;,]*(?:principal\s*bruto(?:/líquido)?|bruto/líquido)', texto_processado, re.IGNORECASE)
                if valor_match:
                    valor_str = valor_match.group(1).strip()
                    valor_str = self._limpar_valor_monetario(valor_str)
                    valor_principal = float(valor_str) if valor_str else None
                    logger.info(f"Valor principal bruto/líquido extraído (texto completo): {valor_principal}")
            
            # Renomeado para valor_principal para compatibilidade com o novo modelo
            dados_processo['valor_principal'] = valor_principal
            
            # Valor dos juros moratórios
            valor_juros_moratorios = None
            if secao_valores:
                # Primeiro verifica se contém "sem - juros moratórios"
                if re.search(r'sem\s*-\s*juros\s*morat[óo]rios', secao_valores, re.IGNORECASE):
                    logger.info("Sem juros moratórios mencionado na seção de valores")
                else:
                    # Procura por "R$ X - juros moratórios" na seção de valores
                    valor_match = re.search(r'R\$\s*([0-9.,]+)[^;,]*(?:juros\s*morat[óo]rios)', secao_valores, re.IGNORECASE)
                    if valor_match:
                        valor_str = valor_match.group(1).strip()
                        valor_str = self._limpar_valor_monetario(valor_str)
                        valor_juros_moratorios = float(valor_str) if valor_str else None
                        logger.info(f"Valor dos juros moratórios extraído: {valor_juros_moratorios}")
            
            # Se não encontrou na seção específica, tenta no texto completo
            if valor_juros_moratorios is None:
                if re.search(r'sem\s*-\s*juros\s*morat[óo]rios', texto_processado, re.IGNORECASE):
                    logger.info("Sem juros moratórios mencionado no texto")
                else:
                    valor_match = re.search(r'R\$\s*([0-9.,]+)[^;,]*(?:juros\s*morat[óo]rios)', texto_processado, re.IGNORECASE)
                    if valor_match:
                        valor_str = valor_match.group(1).strip()
                        valor_str = self._limpar_valor_monetario(valor_str)
                        valor_juros_moratorios = float(valor_str) if valor_str else None
                        logger.info(f"Valor dos juros moratórios extraído (texto completo): {valor_juros_moratorios}")
            
            dados_processo['valor_juros_moratorios'] = valor_juros_moratorios
            
            # Honorários advocatícios
            honorarios_advocaticios = None
            if secao_valores:
                # Procura por "R$ X - honorários advocatícios" na seção de valores
                valor_match = re.search(r'R\$\s*([0-9.,]+)[^;,]*(?:honor[áa]rios\s*advocat[íi]cios)', secao_valores, re.IGNORECASE)
                if valor_match:
                    valor_str = valor_match.group(1).strip()
                    valor_str = self._limpar_valor_monetario(valor_str)
                    honorarios_advocaticios = float(valor_str) if valor_str else None
                    logger.info(f"Valor dos honorários advocatícios extraído: {honorarios_advocaticios}")
            
            # Se não encontrou na seção específica, tenta no texto completo
            if not honorarios_advocaticios:
                valor_match = re.search(r'R\$\s*([0-9.,]+)[^;,]*(?:honor[áa]rios\s*advocat[íi]cios)', texto_processado, re.IGNORECASE)
                if valor_match:
                    valor_str = valor_match.group(1).strip()
                    valor_str = self._limpar_valor_monetario(valor_str)
                    honorarios_advocaticios = float(valor_str) if valor_str else None
                    logger.info(f"Valor dos honorários advocatícios extraído (texto completo): {honorarios_advocaticios}")
            
            dados_processo['honorarios_advocaticios'] = honorarios_advocaticios
            
            return dados_processo
            
        except Exception as e:
            logger.error(f"Erro ao extrair dados do processo: {e}")
            return None
    
    def _limpar_valor_monetario(self, valor_str):
        """
        Função auxiliar para limpar e formatar valores monetários.
        Remove R$, espaços e formata corretamente para conversão para float.
        """
        if not valor_str:
            return None
            
        # Remove caracteres não numéricos, exceto pontos e vírgulas
        valor_str = re.sub(r'[^\d,.]', '', valor_str)
        
        # Tratamento para diferentes formatos de números (1.234,56 ou 1234,56 ou 1,234.56)
        try:
            # Formato brasileiro (1.234,56)
            if ',' in valor_str and '.' in valor_str and valor_str.rindex('.') < valor_str.rindex(','):
                valor_str = valor_str.replace('.', '').replace(',', '.')
            # Formato com vírgula como decimal (1234,56)
            elif ',' in valor_str and '.' not in valor_str:
                valor_str = valor_str.replace(',', '.')
                
            return valor_str
        except Exception as e:
            logger.warning(f"Erro ao limpar valor monetário '{valor_str}': {e}")
            return None
    
    # Método antigo removido, substituído pelo _limpar_valor_monetario
    
    def buscar_publicacoes(self, primeira_execucao=False):
        """Realiza a busca de publicações no DJE"""
        publicacoes = []
        
        try:
            # Acessa a página de consulta avançada
            if not self.acessar_consulta_avancada():
                logger.error("Falha ao acessar a página de consulta avançada")
                return publicacoes
            
            # Define o período de busca
            hoje = datetime.date.today()
            
            if primeira_execucao:
                # Na primeira execução, busca pelos últimos DIAS_PRIMEIRA_BUSCA dias
                data_inicial = hoje - timedelta(days=DIAS_PRIMEIRA_BUSCA)
                data_final = hoje
                logger.info(f"Primeira execução: buscando de {data_inicial.strftime('%d/%m/%Y')} até {data_final.strftime('%d/%m/%Y')}")
            else:
                # Nas execuções subsequentes, busca apenas pelo dia atual
                data_inicial = hoje
                data_final = hoje
                logger.info(f"Execução diária: buscando apenas para {hoje.strftime('%d/%m/%Y')}")
            
            # Verifica se é fim de semana (sábado ou domingo)
            if eh_fim_de_semana(hoje) and not primeira_execucao:
                logger.info(f"Hoje é fim de semana ({hoje.strftime('%d/%m/%Y')}). Pulando execução.")
                return publicacoes
            
            # Usa palavras-chave específicas para encontrar publicações relevantes
            palavras_chave_especificas = '"RPV" e "pagamento pelo INSS"'
            
            # Tenta preencher o formulário usando a abordagem JavaScript
            if not self.preencher_formulario_javascript(data_inicial, data_final):
                logger.warning("Falha ao preencher o formulário via JavaScript. Tentando método tradicional...")
                
                # Se falhar com JavaScript, tenta o método tradicional
                if not self.selecionar_datas(data_inicial, data_final):
                    logger.error("Falha ao preencher datas")
                    return publicacoes
                
                if not self.selecionar_caderno(CADERNO):
                    logger.error("Falha ao selecionar caderno")
                    return publicacoes
                
                if not self.preencher_palavras_chave(palavras_chave_especificas):
                    logger.error("Falha ao preencher palavras-chave")
                    return publicacoes
            
            # Tenta submeter o formulário usando JavaScript
            if not self.submeter_formulario_javascript():
                logger.warning("Falha ao submeter o formulário via JavaScript. Tentando método tradicional...")
                
                # Se falhar, tenta o método tradicional
                if not self.executar_pesquisa():
                    logger.error("Falha ao executar pesquisa")
                    return publicacoes
            
            # Extrai os links das publicações encontradas com seus snippets
            resultados_publicacoes = self.extrair_links_publicacoes()
            logger.info(f"Encontrados {len(resultados_publicacoes)} links de publicações")
            
            # Processa cada publicação para extrair os dados
            for idx, resultado in enumerate(resultados_publicacoes):
                logger.info(f"Processando publicação {idx + 1} de {len(resultados_publicacoes)}: {resultado['url']}")
                
                try:
                    # Preparar o item para processamento
                    publicacao_item = {
                        'url': resultado['url'],
                        'snippet': resultado.get('snippet', '')
                    }
                    
                    # Processa a publicação para extrair dados
                    dados_publicacao = self.processar_publicacao(publicacao_item)
                    
                    if dados_publicacao:
                        # Verifica se o resultado é uma lista ou um único dicionário
                        if isinstance(dados_publicacao, list):
                            # Se for uma lista, adiciona cada processo individualmente
                            for processo in dados_publicacao:
                                publicacoes.append(processo)
                                logger.info(f"Processo adicionado com sucesso: Processo {processo.get('numero_processo', 'N/A')}")
                        else:
                            # Se for um único dicionário, adiciona normalmente
                            publicacoes.append(dados_publicacao)
                            logger.info(f"Publicação {idx + 1} adicionada com sucesso: Processo {dados_publicacao.get('numero_processo', 'N/A')}")
                    else:
                        logger.warning(f"Não foi possível extrair dados da publicação {idx + 1}")
                        
                except Exception as e:
                    logger.error(f"Erro ao processar publicação {idx + 1}: {e}")
            
            logger.info(f"Total de {len(publicacoes)} publicações processadas e prontas para salvar no banco")
            
            # Salva todas as publicações com uma única conexão ao banco
            if publicacoes:
                # Importa a função de conexão com o banco
                from database import Database
                
                # Conecta ao banco de dados uma única vez
                logger.info(f"Conectando ao banco de dados para salvar {len(publicacoes)} publicações...")
                db = Database()
                
                # Verifica se a conexão foi estabelecida
                if not db.conn:
                    logger.error("Não foi possível conectar ao banco de dados. Nenhuma publicação será salva.")
                    return publicacoes
                
                # Limpa conexões ociosas em transação antes de iniciar
                conexoes_limpas = db.limpar_conexoes_ociosas()
                if conexoes_limpas > 0:
                    logger.info(f"Foram limpas {conexoes_limpas} conexões ociosas antes de iniciar as inserções")
                
                publicacoes_salvas = 0
                
                # Usa tratamento de erro para todo o lote de inserções
                try:
                    for publicacao in publicacoes:
                        try:
                            # Prepara os dados para inserção
                            valores = {
                                'numero_processo': publicacao.get('numero_processo'),
                                'data_disponibilizacao': publicacao.get('data_disponibilizacao'),
                                'autor': publicacao.get('autor'),
                                'reu': publicacao.get('reu', 'Instituto Nacional do Seguro Social - INSS'),
                                'advogado': publicacao.get('advogado'),
                                'valor_principal': publicacao.get('valor_principal'),
                                'valor_juros_moratorios': publicacao.get('valor_juros_moratorios'),
                                'honorarios_advocaticios': publicacao.get('honorarios_advocaticios'),
                                'conteudo_completo': publicacao.get('conteudo_completo')
                            }
                            
                            # Insere os dados na tabela publicacoes
                            id_publicacao = db.inserir_publicacao(valores)
                            
                            if id_publicacao:
                                publicacoes_salvas += 1
                                logger.info(f"Publicação inserida com sucesso: ID {id_publicacao}")
                                
                        except Exception as e:
                            logger.error(f"Erro ao inserir publicação no banco (processo {publicacao.get('numero_processo')}): {e}")
                    
                    logger.info(f"Salvas {publicacoes_salvas} de {len(publicacoes)} publicações no banco de dados")
                except Exception as e:
                    logger.error(f"Erro durante o processamento em lote de publicações: {e}")
                finally:
                    # Limpa conexões ociosas novamente ao finalizar
                    db.limpar_conexoes_ociosas()
                    # Fecha a conexão com o banco
                    db.fechar_conexao()
        
        except Exception as e:
            logger.error(f"Erro durante a busca de publicações: {e}")
        
        return publicacoes
    
    def preencher_formulario_javascript(self, data_inicial, data_final):
        """Preenche o formulário completo usando JavaScript diretamente"""
        try:
            logger.info("Tentando preencher formulário via JavaScript...")
            
            # Formata as datas no padrão DD/MM/AAAA
            data_inicial_str = data_inicial.strftime("%d/%m/%Y")
            data_final_str = data_final.strftime("%d/%m/%Y")
            
            # Script JavaScript para preencher o formulário diretamente
            script = """
            // Preenche os campos de data
            document.getElementsByName('dadosConsulta.dtInicio')[0].value = arguments[0];
            document.getElementsByName('dadosConsulta.dtFim')[0].value = arguments[1];
            
            // Seleciona o caderno
            var selectCaderno = document.getElementsByName('dadosConsulta.cdCaderno')[0];
            selectCaderno.value = '12';
            
            // Dispara evento de mudança para garantir que o valor seja aplicado
            var event = new Event('change', { bubbles: true });
            selectCaderno.dispatchEvent(event);
            
            // Preenche as palavras-chave
            document.getElementsByName('dadosConsulta.pesquisaLivre')[0].value = arguments[2];
            
            // Retorna true se todos os campos foram preenchidos
            return (
                document.getElementsByName('dadosConsulta.dtInicio')[0].value === arguments[0] &&
                document.getElementsByName('dadosConsulta.dtFim')[0].value === arguments[1] &&
                document.getElementsByName('dadosConsulta.cdCaderno')[0].value === '12' &&
                document.getElementsByName('dadosConsulta.pesquisaLivre')[0].value === arguments[2]
            );
            """
            
            # Executa o script JavaScript
            palavras_str = '"RPV" e "pagamento pelo INSS"'
            resultado = self.driver.execute_script(script, data_inicial_str, data_final_str, palavras_str)
            
            # Verifica se o script foi bem-sucedido
            if resultado:
                logger.info("Formulário preenchido com sucesso via JavaScript")
                return True
            else:
                logger.warning("JavaScript não conseguiu preencher todos os campos corretamente")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao preencher formulário via JavaScript: {e}")
            return False
    
    def submeter_formulario_javascript(self):
        """Submete o formulário usando JavaScript diretamente"""
        try:
            logger.info("Tentando submeter formulário via JavaScript...")
            
            # Script JavaScript para submeter o formulário
            script = """
            // Encontra o botão de pesquisa e simula o clique
            var botaoPesquisar = document.getElementsByName('Pesquisar')[0];
            if (botaoPesquisar) {
                botaoPesquisar.click();
                return true;
            } else {
                // Tenta submeter o formulário diretamente
                var forms = document.getElementsByTagName('form');
                if (forms.length > 0) {
                    forms[0].submit();
                    return true;
                }
                return false;
            }
            """
            
            # Executa o script JavaScript
            resultado = self.driver.execute_script(script)
            
            # Verifica se o script foi bem-sucedido
            if resultado:
                logger.info("Formulário submetido com sucesso via JavaScript")
                
                # Espera um tempo para o resultado da pesquisa
                time.sleep(10)
                
                return True
            else:
                logger.warning("JavaScript não conseguiu submeter o formulário")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao submeter formulário via JavaScript: {e}")
            return False
    
    def extrair_conteudo_iframe(self, url_publicacao):
        """Extrai o conteúdo da publicação acessando diretamente o iframe"""
        try:
            # Acessa a página da publicação
            logger.info(f"Acessando página de publicação: {url_publicacao}")
            self.driver.get(url_publicacao)
            time.sleep(2)
            
            # Verifica o padrão de URL do TJSP e extrai os parâmetros
            padrao_url_tjsp = re.compile(r'cdVolume=(\d+)&nuDiario=(\d+)&cdCaderno=(\d+)&nuSeqpagina=(\d+)')
            match_params = padrao_url_tjsp.search(url_publicacao)
            
            if match_params:
                # Extrai os parâmetros da URL atual
                cd_volume = match_params.group(1)
                nu_diario = match_params.group(2)
                cd_caderno = match_params.group(3)
                nu_seqpagina = match_params.group(4)
                
                # Constrói a URL direta para o PDF usando o padrão getPaginaDoDiario.do
                pdf_url = f"https://dje.tjsp.jus.br/cdje/getPaginaDoDiario.do?cdVolume={cd_volume}&nuDiario={nu_diario}&cdCaderno={cd_caderno}&nuSeqpagina={nu_seqpagina}"
                logger.info(f"URL direta para o PDF construída: {pdf_url}")
                
                # Baixa e extrai o texto do PDF diretamente
                try:
                    texto_pdf = self.baixar_e_extrair_texto_pdf(pdf_url)
                    if texto_pdf and len(texto_pdf) > 50:
                        logger.info(f"Texto extraído com sucesso do PDF via download direto ({len(texto_pdf)} caracteres)")
                        return texto_pdf
                except Exception as e:
                    logger.error(f"Erro ao baixar/extrair PDF diretamente: {e}")
            
            # Se não conseguiu extrair via URL direta, continua com a lógica tradicional
            # Procura o frame bottomFrame que contém o conteúdo
            iframe_src = None
            frames = self.driver.find_elements(By.TAG_NAME, "frame")
            
            logger.info(f"Encontrados {len(frames)} frames na página")
            
            # Procura especificamente pelo bottomFrame (abordagem robusta)
            for frame in frames:
                frame_name = frame.get_attribute("name")
                frame_id = frame.get_attribute("id")
                
                # Verifica se é o frame bottomFrame
                if (frame_name == "bottomFrame" or frame_id == "bottomFrame"):
                    logger.info("Frame bottomFrame encontrado, extraindo informações")
                    
                    # Obtém o src diretamente do frame (pode ser about:blank)
                    iframe_src_temp = frame.get_attribute("src")
                    
                    # Se o src for válido, usa-o
                    if iframe_src_temp and iframe_src_temp != "about:blank":
                        iframe_src = iframe_src_temp
                        logger.info(f"Encontrado frame bottomFrame com src: {iframe_src}")
                    else:
                        # Se o src for about:blank, extrai do atributo title ou outra propriedade
                        title = frame.get_attribute("title")
                        if "getPaginaDoDiario.do" in title:
                            logger.info(f"Encontrada URL do PDF no title do frame: {title}")
                            iframe_src = title.strip()
                    
                    # Tenta extrair a URL do bottomFrame via JavaScript
                    if not iframe_src or iframe_src == "about:blank":
                        try:
                            # Troca para o frame para poder inspecionar seu conteúdo
                            self.driver.switch_to.frame(frame)
                            
                            # Extrai o HTML completo do frame
                            frame_html = self.driver.page_source
                            
                            # Busca no HTML por URLs de PDF
                            frame_url_match = re.search(r'getPaginaDoDiario\.do\?[^"\'<>]+', frame_html)
                            if frame_url_match:
                                iframe_src = "https://dje.tjsp.jus.br/cdje/" + frame_url_match.group(0)
                                logger.info(f"URL do PDF extraída do HTML do frame: {iframe_src}")
                            
                            # Volta para o contexto principal
                            self.driver.switch_to.default_content()
                        except Exception as frame_error:
                            logger.warning(f"Erro ao acessar conteúdo do frame: {frame_error}")
                            self.driver.switch_to.default_content()
                    
                    break
            
            # Se não encontrou o frame, procura por URLs no HTML
            if not iframe_src:
                logger.info("Frame bottomFrame não encontrado ou sem URL, procurando no HTML")
                html = self.driver.page_source
                
                # Procura pelo padrão específico de URL do TJSP no HTML
                frame_match = re.search(r'frame[^>]*src=[\'"](https?://[^\'"]*/getPaginaDoDiario\.do\?[^\'"]+)[\'"]', html)
                if frame_match:
                    iframe_src = frame_match.group(1)
                    logger.info(f"URL do frame extraída do HTML: {iframe_src}")
                else:
                    # Tenta outro padrão para o frame
                    frame_match = re.search(r'getPaginaDoDiario\.do\?[^\'"\s&<>]+', html)
                    if frame_match:
                        iframe_src = "https://dje.tjsp.jus.br/cdje/" + frame_match.group(0)
                        logger.info(f"URL do frame extraída do HTML via regex simples: {iframe_src}")
                    else:
                        # Procura pelo src do frame no document principal
                        doc_match = re.search(r'#document\(([^)]+)\)', html)
                        if doc_match:
                            iframe_src = doc_match.group(1)
                            logger.info(f"URL extraída de #document: {iframe_src}")
            
            # Se encontrou a URL do iframe, tenta baixar o PDF e extrair o texto
            if iframe_src:
                logger.info(f"Tentando baixar e extrair texto do PDF: {iframe_src}")
                try:
                    texto_pdf = self.baixar_e_extrair_texto_pdf(iframe_src)
                    if texto_pdf and len(texto_pdf) > 50:
                        logger.info(f"Texto extraído com sucesso do PDF ({len(texto_pdf)} caracteres)")
                        return texto_pdf
                except Exception as e:
                    logger.error(f"Erro ao baixar/extrair PDF: {e}")
                
                # Se falhou a extração direta do PDF, tenta navegar até a URL e extrair o conteúdo
                logger.info(f"Acessando URL do iframe: {iframe_src}")
                self.driver.get(iframe_src)
                time.sleep(3)  # Espera para carregar o conteúdo
                
                # Verifica se há um PDF incorporado na página
                pdf_embeds = self.driver.find_elements(By.CSS_SELECTOR, "embed[type='application/pdf'], object[type='application/pdf']")
                if pdf_embeds:
                    logger.info(f"Encontrado elemento PDF incorporado ({len(pdf_embeds)} elementos)")
                    return self.extrair_texto_pdf_incorporado()
                
                # Continua com a lógica existente para extração de HTML
                html_iframe = self.driver.page_source
                soup = BeautifulSoup(html_iframe, 'html.parser')
                
                # Primeiro procura por elementos <pre> que geralmente contêm o texto da publicação
                pre_elementos = soup.find_all("pre")
                if pre_elementos:
                    logger.info(f"Encontrados {len(pre_elementos)} elementos <pre> no iframe")
                    texto_completo = pre_elementos[0].text
                    logger.info(f"Texto extraído do elemento <pre> ({len(texto_completo)} caracteres)")
                    return texto_completo
                
                # Se não encontrou <pre>, procura por divs com texto
                div_texto = soup.find("div", {"id": "texto"})
                if div_texto:
                    texto_completo = div_texto.text
                    logger.info(f"Texto extraído da div#texto ({len(texto_completo)} caracteres)")
                    return texto_completo
                
                # Tenta outras divs que possam conter o texto
                div_elementos = soup.find_all("div", class_=lambda x: x and "conteudo" in x.lower())
                if div_elementos:
                    texto_completo = div_elementos[0].text
                    logger.info(f"Texto extraído de div.conteudo ({len(texto_completo)} caracteres)")
                    return texto_completo
                
                # Como último recurso, tenta extrair de todo o body
                body = soup.find("body")
                if body:
                    texto_completo = body.text
                    logger.info(f"Texto extraído do body ({len(texto_completo)} caracteres)")
                    return texto_completo
                
                # Se ainda não encontrou nada, tenta com JavaScript
                try:
                    texto_js = self.driver.execute_script("""
                        // Tenta diferentes elementos
                        var pre = document.querySelector('pre');
                        if (pre) return pre.innerText;
                        
                        var divTexto = document.getElementById('texto');
                        if (divTexto) return divTexto.innerText;
                        
                        var divs = document.querySelectorAll('div');
                        for (var i = 0; i < divs.length; i++) {
                            if (divs[i].innerText && divs[i].innerText.length > 100) {
                                return divs[i].innerText;
                            }
                        }
                        
                        // Verifica novamente por PDF, caso tenha carregado depois
                        var embedPdf = document.querySelector('embed[type="application/pdf"]');
                        if (embedPdf) {
                            console.log("Encontrado embed PDF via JavaScript");
                            return "PDF_DETECTADO";
                        }
                        
                        var objectPdf = document.querySelector('object[type="application/pdf"]');
                        if (objectPdf) {
                            console.log("Encontrado object PDF via JavaScript");
                            return "PDF_DETECTADO";
                        }
                        
                        // Se tudo falhar, retorna o texto de todo o body
                        return document.body.innerText;
                    """)
                    
                    if texto_js == "PDF_DETECTADO":
                        logger.info("PDF detectado via JavaScript, tentando extração específica")
                        return self.extrair_texto_pdf_incorporado()
                    
                    if texto_js and len(texto_js) > 10:  # Verifica se o texto tem tamanho mínimo
                        logger.info(f"Texto extraído via JavaScript ({len(texto_js)} caracteres)")
                        return texto_js
                except Exception as js_error:
                    logger.error(f"Erro ao extrair texto via JavaScript: {js_error}")
                
                logger.error("Nenhum conteúdo de texto encontrado no iframe")
                
                # Voltar para a página original
                self.driver.get(url_publicacao)
                return None
            else:
                logger.error("Não foi possível encontrar a URL do iframe com o conteúdo")
                return None
                
        except Exception as e:
            logger.error(f"Erro ao extrair conteúdo do iframe: {e}")
            return None
            
    def baixar_e_extrair_texto_pdf(self, pdf_url):
        """
        Baixa um PDF a partir da URL fornecida e extrai seu texto.
        Método otimizado para o caso específico do TJSP.
        """
        try:
            import io
            import requests
            import tempfile
            import os
            from PyPDF2 import PdfReader
            
            logger.info(f"Baixando PDF diretamente da URL: {pdf_url}")
            
            # Adiciona headers para simular um navegador real (importante para alguns sites)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/pdf,*/*',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive',
                'Referer': 'https://dje.tjsp.jus.br/'
            }
            
            # Cria uma sessão para manter cookies e outras informações
            session = requests.Session()
            
            # Adiciona os headers à sessão
            session.headers.update(headers)
            
            # Tenta extrair cookies do Selenium e adicioná-los à sessão
            try:
                selenium_cookies = self.driver.get_cookies()
                for cookie in selenium_cookies:
                    session.cookies.set(cookie['name'], cookie['value'], domain=cookie['domain'])
                logger.info(f"Adicionados {len(selenium_cookies)} cookies do Selenium à sessão")
            except Exception as e:
                logger.warning(f"Erro ao extrair cookies do Selenium: {e}")
            
            # Primeiro acessa a página principal para obter cookies de sessão
            try:
                session.get("https://dje.tjsp.jus.br/cdje/index.do", timeout=10)
                logger.info("Acessada página inicial para obter cookies de sessão")
            except Exception as e:
                logger.warning(f"Erro ao acessar página inicial: {e}")
            
            # Agora tenta baixar o PDF
            try:
                logger.info("Fazendo requisição para o PDF...")
                response = session.get(pdf_url, timeout=30)
                response.raise_for_status()  # Levanta exceção se o status não for 200
                
                # Verifica se o conteúdo realmente é um PDF
                if response.content.startswith(b'%PDF'):
                    logger.info("Conteúdo PDF válido recebido")
                else:
                    logger.warning("O conteúdo baixado não parece ser um PDF válido")
                    # Verifica se é redirecionamento ou erro
                    if b'<html' in response.content[:100]:
                        logger.warning("O conteúdo parece ser HTML em vez de PDF")
                        
                        # Tenta acessar a página novamente pelo Selenium e então tentar o download
                        try:
                            self.driver.get(pdf_url)
                            time.sleep(3)
                            selenium_cookies = self.driver.get_cookies()
                            
                            # Reinicia a sessão com novos cookies
                            session = requests.Session()
                            session.headers.update(headers)
                            
                            for cookie in selenium_cookies:
                                session.cookies.set(cookie['name'], cookie['value'], domain=cookie.get('domain', ''))
                            
                            # Tenta o download novamente
                            logger.info("Tentando download novamente com cookies atualizados...")
                            response = session.get(pdf_url, timeout=30)
                            response.raise_for_status()
                            
                            if not response.content.startswith(b'%PDF'):
                                logger.error("Falha na segunda tentativa de download")
                                return None
                        except Exception as e:
                            logger.error(f"Erro na tentativa de obter novos cookies: {e}")
                            return None
            except requests.exceptions.RequestException as e:
                logger.error(f"Erro na requisição HTTP: {e}")
                return None
            
            # Salva o PDF em um arquivo temporário (útil para pdfminer que prefere arquivos)
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
                temp_path = temp_file.name
                temp_file.write(response.content)
                logger.info(f"PDF salvo temporariamente em: {temp_path}")
            
            texto_completo = ""
            
            # Tenta diferentes métodos de extração, começando pelo PyPDF2
            try:
                # Método 1: PyPDF2
                with open(temp_path, 'rb') as file:
                    reader = PdfReader(file)
                    num_paginas = len(reader.pages)
                    
                    logger.info(f"Extraindo texto de {num_paginas} páginas com PyPDF2")
                    
                    for i in range(num_paginas):
                        page = reader.pages[i]
                        texto_pagina = page.extract_text()
                        
                        if texto_pagina:
                            texto_completo += texto_pagina + "\n\n"
                    
                    if texto_completo and len(texto_completo) > 100:
                        logger.info(f"Texto extraído com PyPDF2: {len(texto_completo)} caracteres")
                        
                        # Limpeza do arquivo temporário
                        try:
                            os.unlink(temp_path)
                        except Exception as e:
                            logger.warning(f"Erro ao remover arquivo temporário: {e}")
                            
                        return texto_completo
                    else:
                        logger.warning("PyPDF2 extraiu texto insuficiente, tentando método alternativo")
            except Exception as e:
                logger.warning(f"Erro ao extrair texto com PyPDF2: {e}")
            
            # Método 2: pdfminer.six (geralmente mais preciso, mas mais lento)
            try:
                from pdfminer.high_level import extract_text
                
                logger.info("Tentando extrair texto com pdfminer.six")
                texto_pdfminer = extract_text(temp_path)
                
                if texto_pdfminer and len(texto_pdfminer) > 100:
                    logger.info(f"Texto extraído com pdfminer.six: {len(texto_pdfminer)} caracteres")
                    
                    # Limpeza do arquivo temporário
                    os.unlink(temp_path)
                    return texto_pdfminer
                else:
                    logger.warning("pdfminer.six extraiu texto insuficiente")
            except Exception as e:
                logger.warning(f"Erro ao extrair texto com pdfminer.six: {e}")
            
            # Método 3: último recurso - OCR via Tesseract se disponível
            try:
                import pytesseract
                from PIL import Image
                from pdf2image import convert_from_path
                
                logger.info("Tentando extrair texto via OCR (Tesseract)")
                
                # Converte PDF para imagens
                images = convert_from_path(temp_path)
                
                texto_ocr = ""
                for i, image in enumerate(images):
                    logger.info(f"Processando página {i+1} com OCR")
                    texto_pagina = pytesseract.image_to_string(image, lang='por')
                    texto_ocr += texto_pagina + "\n\n"
                
                if texto_ocr and len(texto_ocr) > 100:
                    logger.info(f"Texto extraído via OCR: {len(texto_ocr)} caracteres")
                    
                    # Limpeza do arquivo temporário
                    os.unlink(temp_path)
                    return texto_ocr
            except ImportError:
                logger.warning("OCR não disponível (pytesseract/pdf2image não instalados)")
            except Exception as e:
                logger.warning(f"Erro ao extrair texto via OCR: {e}")
            
            # Limpeza do arquivo temporário
            try:
                os.unlink(temp_path)
                logger.info("Arquivo temporário removido")
            except Exception as e:
                logger.warning(f"Erro ao remover arquivo temporário: {e}")
            
            # Se chegou aqui, nenhum método funcionou
            logger.error("Todos os métodos de extração de texto do PDF falharam")
            return None
            
        except Exception as e:
            logger.error(f"Erro ao baixar e processar o PDF: {e}")
            return None
    
    def acessar_frame_com_pdf(self, url_publicacao):
        """
        Acessa diretamente o frame que contém o PDF e tenta extrair seu conteúdo.
        Abordagem especializada para o caso do bottomFrame.
        """
        try:
            logger.info(f"Tentando acessar bottomFrame com PDF em: {url_publicacao}")
            self.driver.get(url_publicacao)
            time.sleep(3)
            
            # Localiza o frame bottomFrame
            bottom_frame = None
            try:
                frames = self.driver.find_elements(By.TAG_NAME, "frame")
                for frame in frames:
                    if frame.get_attribute("name") == "bottomFrame" or frame.get_attribute("id") == "bottomFrame":
                        bottom_frame = frame
                        logger.info("Encontrado bottomFrame")
                        break
            except Exception as e:
                logger.warning(f"Erro ao localizar frames: {e}")
            
            if bottom_frame:
                # Tenta acessar o frame diretamente
                try:
                    self.driver.switch_to.frame(bottom_frame)
                    logger.info("Alternou para o bottomFrame")
                    time.sleep(2)
                    
                    # Procura por elementos de PDF no frame
                    pdf_embeds = self.driver.find_elements(By.CSS_SELECTOR, "embed[type='application/pdf']")
                    
                    if pdf_embeds:
                        logger.info(f"Encontrado embed de PDF dentro do bottomFrame ({len(pdf_embeds)} elementos)")
                        
                        # Extrai atributos importantes do embed
                        pdf_embed = pdf_embeds[0]
                        pdf_src = pdf_embed.get_attribute("src") or "about:blank"
                        pdf_id = pdf_embed.get_attribute("id") or ""
                        pdf_name = pdf_embed.get_attribute("name") or ""
                        internal_id = pdf_embed.get_attribute("internalid") or ""
                        
                        logger.info(f"Atributos do PDF: src={pdf_src}, id={pdf_id}, name={pdf_name}, internalid={internal_id}")
                        
                        # Caso específico para o elemento identificado no exemplo do usuário
                        if internal_id and pdf_src == "about:blank":
                            logger.info(f"Caso específico detectado: PDF com internalid={internal_id} e src=about:blank")
                            
                            # Tenta obter o texto selecionando todo o conteúdo do PDF
                            try:
                                # Clica no elemento para focar
                                actions = ActionChains(self.driver)
                                actions.move_to_element(pdf_embed).click().perform()
                                time.sleep(1)
                                
                                # Simula Ctrl+A para selecionar todo o texto
                                actions.key_down(Keys.CONTROL).send_keys('a').key_up(Keys.CONTROL).perform()
                                time.sleep(1)
                                
                                # Tenta obter o texto selecionado
                                texto_selecionado = self.driver.execute_script("return window.getSelection().toString();")
                                
                                if texto_selecionado and len(texto_selecionado) > 10:
                                    logger.info(f"Texto extraído do PDF via seleção ({len(texto_selecionado)} caracteres)")
                                    return texto_selecionado
                            except Exception as e:
                                logger.warning(f"Erro ao tentar selecionar texto do PDF: {e}")
                        
                        # Tenta extrair o conteúdo usando nosso método especializado
                        texto_pdf = self.extrair_texto_pdf_incorporado()
                        if texto_pdf:
                            return texto_pdf
                    
                    # Se não encontrou embed de PDF, procura por iframes que possam conter o PDF
                    pdf_iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
                    if pdf_iframes:
                        for iframe in pdf_iframes:
                            try:
                                iframe_src = iframe.get_attribute("src") or ""
                                if ".pdf" in iframe_src.lower() or iframe_src == "about:blank":
                                    logger.info(f"Encontrado iframe que pode conter PDF: {iframe_src}")
                                    
                                    # Tenta acessar o iframe
                                    self.driver.switch_to.frame(iframe)
                                    time.sleep(1)
                                    
                                    # Verifica se há PDF dentro do iframe
                                    pdf_in_iframe = self.driver.find_elements(By.CSS_SELECTOR, "embed[type='application/pdf']")
                                    if pdf_in_iframe:
                                        logger.info("Encontrado PDF dentro do iframe aninhado")
                                        return self.extrair_texto_pdf_incorporado()
                                    
                                    # Volta para o frame pai
                                    self.driver.switch_to.parent_frame()
                            except Exception as e:
                                logger.warning(f"Erro ao acessar iframe aninhado: {e}")
                                self.driver.switch_to.default_content()
                                self.driver.switch_to.frame(bottom_frame)  # Volta para o bottomFrame
                    
                    # Se não encontrou o PDF, volta para o conteúdo principal
                    self.driver.switch_to.default_content()
                except Exception as e:
                    logger.warning(f"Erro ao processar bottomFrame: {e}")
                    self.driver.switch_to.default_content()
            else:
                # Verifica se existe algum frame com src que contenha getPaginaDoDiario.do
                try:
                    frames = self.driver.find_elements(By.TAG_NAME, "frame")
                    for frame in frames:
                        frame_src = frame.get_attribute("src") or ""
                        if "getPaginaDoDiario.do" in frame_src:
                            logger.info(f"Encontrado frame alternativo com src={frame_src}")
                            
                            # Tenta acessar esse frame
                            self.driver.switch_to.frame(frame)
                            time.sleep(2)
                            
                            # Procura por PDF no frame
                            pdf_embeds = self.driver.find_elements(By.CSS_SELECTOR, "embed[type='application/pdf']")
                            if pdf_embeds:
                                logger.info("Encontrado PDF no frame alternativo")
                                return self.extrair_texto_pdf_incorporado()
                            
                            # Volta para o conteúdo principal
                            self.driver.switch_to.default_content()
                except Exception as e:
                    logger.warning(f"Erro ao verificar frames alternativos: {e}")
                    self.driver.switch_to.default_content()
            
            # Se chegou aqui, não conseguiu acessar o PDF via frames
            logger.warning("Não foi possível acessar o PDF via frames")
            return None
            
        except Exception as e:
            logger.error(f"Erro ao acessar frame com PDF: {e}")
            try:
                self.driver.switch_to.default_content()
            except:
                pass
            return None
    
    def extrair_texto_pdf_incorporado(self):
        """Tenta extrair texto de um PDF incorporado na página"""
        logger.info("Tentando extrair texto do PDF incorporado")
        
        try:
            # Método 1: Tenta encontrar o elemento embed do PDF
            pdf_elements = self.driver.find_elements(By.TAG_NAME, "embed")
            
            if pdf_elements:
                pdf_element = pdf_elements[0]
                pdf_id = pdf_element.get_attribute("id") or pdf_element.get_attribute("name")
                
                if pdf_id:
                    logger.info(f"Encontrado elemento embed de PDF com ID/name: {pdf_id}")
                    
                    # Tenta configurar um receptor de mensagens para obter o conteúdo
                    try:
                        logger.info("Configurando receptor de mensagens para o conteúdo do PDF")
                        
                        # Executar JavaScript para tentar obter o texto do PDF
                        script = """
                        var pdfCallback = arguments[0];
                        try {
                            var pdfViewer = document.getElementById(arguments[1]) || document.getElementsByName(arguments[1])[0];
                            if (pdfViewer && pdfViewer.contentWindow) {
                                var pdfDocument = pdfViewer.contentWindow.PDFViewerApplication.pdfDocument;
                                var numPages = pdfDocument.numPages;
                                var textPromises = [];
                                
                                for (var i = 1; i <= numPages; i++) {
                                    textPromises.push(pdfDocument.getPage(i).then(function(page) {
                                        return page.getTextContent();
                                    }).then(function(textContent) {
                                        return textContent.items.map(function(item) {
                                            return item.str;
                                        }).join(' ');
                                    }));
                                }
                                
                                Promise.all(textPromises).then(function(pageTexts) {
                                    pdfCallback(pageTexts.join(' '));
                                });
                                return true;
                            }
                            return false;
                        } catch (e) {
                            console.error("Erro ao extrair texto do PDF:", e);
                            return false;
                        }
                        """
                        
                        # Tenta executar o script com timeout
                        pdf_text = None
                        
                        def callback(text):
                            nonlocal pdf_text
                            pdf_text = text
                        
                        success = self.driver.execute_script(script, callback, pdf_id)
                        
                        # Espera um pouco para ver se o callback é chamado
                        wait_time = 5
                        logger.info(f"Aguardando {wait_time} segundos pelo retorno do texto...")
                        time.sleep(wait_time)
                        
                        if pdf_text and len(pdf_text) > 50:
                            logger.info(f"Texto extraído do PDF via JavaScript: {len(pdf_text)} caracteres")
                            return pdf_text
                        else:
                            logger.warning("Não foi possível obter texto via receptor de mensagens")
                    except Exception as e:
                        logger.warning(f"Erro ao tentar extrair texto do PDF via JavaScript: {e}")
                    
                    # Método 2: Tenta obter a URL do PDF e baixar diretamente
                    try:
                        # Tenta obter o src do elemento
                        pdf_src = pdf_element.get_attribute("src")
                        logger.info(f"URL do PDF encontrada: {pdf_src}")
                        
                        # Tenta encontrar o ID interno para construir a URL direta
                        internal_id = None
                        try:
                            internal_id_script = """
                            try {
                                var pdfViewer = document.getElementById(arguments[0]) || document.getElementsByName(arguments[0])[0];
                                if (pdfViewer && pdfViewer.contentWindow && pdfViewer.contentWindow.PDFViewerApplication) {
                                    return pdfViewer.contentWindow.PDFViewerApplication.pdfLoadingTask._internalId;
                                }
                                return null;
                            } catch (e) {
                                console.error("Erro ao obter internalID:", e);
                                return null;
                            }
                            """
                            internal_id = self.driver.execute_script(internal_id_script, pdf_id)
                            
                            if internal_id:
                                logger.info(f"Encontrado internalID para o PDF: {internal_id}")
                                
                                # Construir URL direta
                                current_url = self.driver.current_url
                                base_url = "/".join(current_url.split("/")[:-1])
                                
                                # Tenta extrair parâmetros da URL atual
                                params = {}
                                if "?" in current_url:
                                    query_string = current_url.split("?")[1]
                                    for param in query_string.split("&"):
                                        if "=" in param:
                                            key, value = param.split("=", 1)
                                            params[key] = value
                                
                                # Construir a URL do PDF
                                # Aqui seria necessário conhecer o formato exato da URL
                                # do PDF no site específico, o que pode variar
                            
                        except Exception as e:
                            logger.warning(f"Erro ao tentar encontrar URL do PDF: {e}")
                    except Exception as e:
                        logger.warning(f"Erro ao tentar obter URL do PDF diretamente: {e}")
                    
                    # Método 3: Tenta extrair via canvas (não implementado aqui)
                    # Isso exigiria mais JavaScript específico para o viewer de PDF
            
            # Se chegou aqui, não conseguiu extrair por nenhum método
            return None
            
        except Exception as e:
            logger.error(f"Erro ao extrair texto do PDF incorporado: {e}")
            return None
    
    def verificar_processo_incompleto(self, texto):
        """Verifica se o último processo está incompleto (termina sem o padrão ADV)"""
        if not texto:
            return False
            
        # Encontra o último "Processo" no texto
        ultima_ocorrencia = texto.rfind("Processo")
        
        if ultima_ocorrencia == -1:
            return False
            
        # Pega o texto a partir do último "Processo"
        ultimo_processo = texto[ultima_ocorrencia:]
        
        # Verifica se este último processo termina com o padrão esperado
        return not re.search(r'ADV:.*?\(OAB.*?\)', ultimo_processo, re.DOTALL)
    
    def navegar_proxima_pagina(self):
        """Tenta navegar para a próxima página da publicação"""
        try:
            # Tenta diferentes seletores para o botão de próxima página
            seletores_proximo = [
                "//a[contains(text(), 'Próxima') or contains(text(), 'Proxima') or contains(text(), '>')]",
                "//a[contains(@title, 'Próxima') or contains(@title, 'Proxima')]",
                "//a[contains(@class, 'next') or contains(@class, 'proxima')]",
                "//button[contains(text(), 'Próxima') or contains(text(), 'Proxima') or contains(text(), '>')]",
                "//button[contains(@title, 'Próxima') or contains(@title, 'Proxima')]",
                "//button[contains(@class, 'next') or contains(@class, 'proxima')]",
                "//img[contains(@alt, 'Próxima') or contains(@alt, 'Proxima')]/parent::a",
                "//span[contains(text(), 'Próxima') or contains(text(), 'Proxima') or contains(text(), '>')]/parent::a"
            ]
            
            # Tenta cada seletor
            for seletor in seletores_proximo:
                try:
                    elementos = self.driver.find_elements(By.XPATH, seletor)
                    if elementos:
                        for elemento in elementos:
                            if elemento.is_displayed() and elemento.is_enabled():
                                logger.info(f"Botão 'Próxima' encontrado com seletor: {seletor}")
                                elemento.click()
                                return True
                except Exception as e:
                    logger.debug(f"Erro ao tentar seletor {seletor}: {e}")
            
            # Se não encontrou com os seletores, tenta localizar por script
            try:
                script = """
                // Lista de possíveis textos para botões de próxima página
                var textos = ['próxima', 'proxima', 'next', 'seguinte', 'avançar', 'avancar', '>'];
                
                // Função para verificar se um elemento contém algum dos textos
                function contem(elemento, textos) {
                    var texto = elemento.textContent.toLowerCase();
                    for (var i = 0; i < textos.length; i++) {
                        if (texto.indexOf(textos[i]) !== -1) return true;
                    }
                    
                    // Verifica também atributos como title, alt, etc.
                    var atributos = ['title', 'alt', 'aria-label'];
                    for (var i = 0; i < atributos.length; i++) {
                        var attr = elemento.getAttribute(atributos[i]);
                        if (attr) {
                            attr = attr.toLowerCase();
                            for (var j = 0; j < textos.length; j++) {
                                if (attr.indexOf(textos[j]) !== -1) return true;
                            }
                        }
                    }
                    
                    return false;
                }
                
                // Busca por elementos <a> ou <button>
                var elementos = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
                
                for (var i = 0; i < elementos.length; i++) {
                    var el = elementos[i];
                    if (contem(el, textos) && el.offsetParent !== null) {
                        // O elemento está visível e contém um dos textos
                        el.click();
                        return true;
                    }
                }
                
                return false;
                """
                
                resultado = self.driver.execute_script(script)
                if resultado:
                    logger.info("Botão 'Próxima' encontrado e clicado via JavaScript")
                    return True
            except Exception as e:
                logger.warning(f"Erro ao tentar navegar via JavaScript: {e}")
            
            logger.warning("Não foi possível encontrar o botão 'Próxima'")
            return False
            
        except Exception as e:
            logger.error(f"Erro ao tentar navegar para próxima página: {e}")
            return False
    
    def processar_pagina_completa(self):
        """
        Processa a página atual, identificando todos os processos e 
        verificando se o último processo está incompleto.
        Se estiver, navega para a próxima página e adiciona o conteúdo faltante.
        Retorna apenas processos que contêm ambas as palavras-chave: 'RPV' e 'pagamento pelo INSS'.
        """
        try:
            processos_validos = []
            texto_pagina_atual = self.driver.page_source
            soup = BeautifulSoup(texto_pagina_atual, 'html.parser')
            texto_completo = soup.get_text()
            
            # Processamento inicial da página
            logger.info("Processando texto da página atual")

            # Verifica se a página começa com um processo incompleto (não começa com "Processo")
            # Isso pode indicar que é uma continuação de um processo da página anterior
            if not texto_completo.strip().startswith("Processo"):
                logger.info("A página atual parece começar com um processo incompleto (não começa com 'Processo')")
                
                # Tenta navegar para a página anterior para buscar o início do processo
                if self.navegar_pagina_anterior():
                    logger.info("Navegação para página anterior bem-sucedida")
                    time.sleep(3)  # Aguarda carregamento
                    
                    # Obtém o texto da página anterior
                    texto_pagina_anterior = self.driver.page_source
                    soup_anterior = BeautifulSoup(texto_pagina_anterior, 'html.parser')
                    texto_anterior = soup_anterior.get_text()
                    
                    # Procura por processos na página anterior
                    ultima_ocorrencia = texto_anterior.rfind("Processo")
                    if ultima_ocorrencia != -1:
                        # Extrai o último processo (possivelmente incompleto) da página anterior
                        processo_incompleto = texto_anterior[ultima_ocorrencia:]
                        logger.info(f"Processo incompleto extraído da página anterior: {processo_incompleto[:100]}...")
                        
                        # Extrai o início da página atual até o primeiro "Processo" (se houver)
                        primeiro_processo_atual = texto_completo.find("Processo")
                        if primeiro_processo_atual > 0:
                            # Extrai a continuação
                            continuacao = texto_completo[:primeiro_processo_atual].strip()
                            logger.info(f"Continuação encontrada na página atual: {continuacao[:100]}...")
                            
                            # Concatena para formar o processo completo
                            processo_completo = processo_incompleto + " " + continuacao
                            
                            # Verifica se o processo completo termina com o padrão esperado
                            if re.search(r'ADV:.*?\(OAB.*?\)', processo_completo, re.DOTALL):
                                logger.info("Processo completo após concatenação com página anterior")
                                
                                # Verifica se contém ambas as palavras-chave
                                if "RPV" in processo_completo and "pagamento pelo INSS" in processo_completo:
                                    processos_validos.append(processo_completo)
                                    logger.info("Processo concatenado válido (contém RPV e pagamento pelo INSS)")
                        
                        # Volta para a página original para continuar o processamento
                        self.driver.get(self.driver.current_url)
                        time.sleep(2)
                        
                        # Recarrega o texto da página atual
                        texto_pagina_atual = self.driver.page_source
                        soup = BeautifulSoup(texto_pagina_atual, 'html.parser')
                        texto_completo = soup.get_text()
            
            # Procura por processos completos na página atual
            processos_completos = re.findall(r'(Processo.*?ADV:.*?\(OAB.*?\))', texto_completo, re.DOTALL)
            logger.info(f"Encontrados {len(processos_completos)} processos completos na página atual")
            
            # Verifica se há processos incompletos
            tem_processo_incompleto = self.verificar_processo_incompleto(texto_completo)
            
            # Processa os processos completos encontrados
            for processo in processos_completos:
                # Verifica se contém ambas as palavras-chave
                if "RPV" in processo and "pagamento pelo INSS" in processo:
                    processos_validos.append(processo)
                    logger.info("Processo válido encontrado (contém RPV e pagamento pelo INSS)")
            
            # Se o último processo estiver incompleto, navega para a próxima página
            if tem_processo_incompleto:
                logger.info("Detectado processo incompleto no final da página atual")
                
                # Extrai o processo incompleto da página atual
                ultima_ocorrencia = texto_completo.rfind("Processo")
                if ultima_ocorrencia != -1:
                    processo_incompleto = texto_completo[ultima_ocorrencia:]
                    logger.info(f"Processo incompleto extraído: {processo_incompleto[:100]}...")
                    
                    # Tenta navegar para a próxima página
                    if self.navegar_proxima_pagina():
                        logger.info("Navegação para próxima página bem-sucedida")
                        time.sleep(3)  # Aguarda carregamento
                        
                        # Obtém o texto da próxima página
                        texto_proxima_pagina = self.driver.page_source
                        soup_proxima = BeautifulSoup(texto_proxima_pagina, 'html.parser')
                        texto_proxima = soup_proxima.get_text()
                        
                        # Procura por processos completos na próxima página
                        processos_proxima_pagina = re.findall(r'(Processo.*?ADV:.*?\(OAB.*?\))', texto_proxima, re.DOTALL)
                        
                        # Tenta encontrar a continuação do processo incompleto
                        # A continuação começa do início da página até o primeiro "Processo" encontrado
                        primeiro_processo_proxima = texto_proxima.find("Processo")
                        
                        if primeiro_processo_proxima > 0:
                            # Há conteúdo antes do primeiro "Processo" na próxima página
                            continuacao = texto_proxima[:primeiro_processo_proxima].strip()
                            logger.info(f"Continuação encontrada na próxima página: {continuacao[:100]}...")
                            
                            # Concatena o processo incompleto com sua continuação
                            processo_completo = processo_incompleto + " " + continuacao
                            
                            # Verifica se agora temos um processo completo
                            if re.search(r'ADV:.*?\(OAB.*?\)', processo_completo, re.DOTALL):
                                logger.info("Processo agora está completo após concatenação")
                                
                                # Verifica se contém ambas as palavras-chave
                                if "RPV" in processo_completo and "pagamento pelo INSS" in processo_completo:
                                    processos_validos.append(processo_completo)
                                    logger.info("Processo concatenado válido (contém RPV e pagamento pelo INSS)")
                        
                        # Processa os processos completos da próxima página
                        for processo in processos_proxima_pagina:
                            if "RPV" in processo and "pagamento pelo INSS" in processo:
                                processos_validos.append(processo)
                                logger.info("Processo válido encontrado na próxima página")
            
            return processos_validos
        
        except Exception as e:
            logger.error(f"Erro ao processar página completa: {e}")
            return []
    
    def navegar_pagina_anterior(self):
        """Tenta navegar para a página anterior da publicação"""
        try:
            # Tenta primeiro pelo ID específico mencionado no exemplo
            try:
                botao_anterior = self.driver.find_element(By.ID, "botaoVoltarPagina")
                if botao_anterior:
                    logger.info("Botão 'Voltar Página' encontrado pelo ID")
                    botao_anterior.click()
                    time.sleep(2)
                    return True
            except NoSuchElementException:
                logger.info("Botão 'Voltar Página' não encontrado pelo ID, tentando outras abordagens")
            
            # Tenta diferentes seletores para o botão de página anterior
            seletores_anterior = [
                "//img[contains(@src, 'diarioVoltar.gif')]",
                "//img[contains(@alt, 'Anterior') or contains(@alt, 'Voltar')]",
                "//a[contains(text(), 'Anterior') or contains(text(), 'Voltar') or contains(text(), '<')]",
                "//a[contains(@title, 'Anterior') or contains(@title, 'Voltar')]",
                "//a[contains(@class, 'prev') or contains(@class, 'anterior') or contains(@class, 'voltar')]",
                "//button[contains(text(), 'Anterior') or contains(text(), 'Voltar') or contains(text(), '<')]",
                "//button[contains(@title, 'Anterior') or contains(@title, 'Voltar')]",
                "//button[contains(@class, 'prev') or contains(@class, 'anterior') or contains(@class, 'voltar')]",
                "//span[contains(text(), 'Anterior') or contains(text(), 'Voltar') or contains(text(), '<')]/parent::a"
            ]
            
            # Tenta cada seletor
            for seletor in seletores_anterior:
                try:
                    elementos = self.driver.find_elements(By.XPATH, seletor)
                    if elementos:
                        for elemento in elementos:
                            if elemento.is_displayed() and elemento.is_enabled():
                                logger.info(f"Botão 'Anterior' encontrado com seletor: {seletor}")
                                elemento.click()
                                time.sleep(2)
                                return True
                except Exception as e:
                    logger.debug(f"Erro ao tentar seletor {seletor}: {e}")
            
            # Se não encontrou com os seletores, tenta localizar por script
            try:
                script = """
                // Lista de possíveis textos para botões de página anterior
                var textos = ['anterior', 'voltar', 'prev', 'previous', '<'];
                
                // Função para verificar se um elemento contém algum dos textos
                function contem(elemento, textos) {
                    var texto = elemento.textContent.toLowerCase();
                    for (var i = 0; i < textos.length; i++) {
                        if (texto.indexOf(textos[i]) !== -1) return true;
                    }
                    
                    // Verifica também atributos como title, alt, etc.
                    var atributos = ['title', 'alt', 'aria-label'];
                    for (var i = 0; i < atributos.length; i++) {
                        var attr = elemento.getAttribute(atributos[i]);
                        if (attr) {
                            attr = attr.toLowerCase();
                            for (var j = 0; j < textos.length; j++) {
                                if (attr.indexOf(textos[j]) !== -1) return true;
                            }
                        }
                    }
                    
                    // Verifica src para imagens
                    if (elemento.tagName === 'IMG') {
                        var src = elemento.getAttribute('src');
                        if (src && (src.indexOf('voltar') !== -1 || src.indexOf('anterior') !== -1 || src.indexOf('prev') !== -1)) {
                            return true;
                        }
                    }
                    
                    return false;
                }
                
                // Busca por elementos <a>, <button>, <img> ou <input>
                var elementos = document.querySelectorAll('a, button, img, input[type="button"], input[type="submit"]');
                
                for (var i = 0; i < elementos.length; i++) {
                    var el = elementos[i];
                    if (contem(el, textos) && el.offsetParent !== null) {
                        // O elemento está visível e contém um dos textos
                        el.click();
                        return true;
                    }
                }
                
                // Busca específica por imagem de voltar mencionada no exemplo
                var imgVoltar = document.querySelector('img[src*="diarioVoltar.gif"]');
                if (imgVoltar) {
                    imgVoltar.click();
                    return true;
                }
                
                return false;
                """
                
                resultado = self.driver.execute_script(script)
                if resultado:
                    logger.info("Botão 'Anterior' encontrado e clicado via JavaScript")
                    time.sleep(2)
                    return True
            except Exception as e:
                logger.warning(f"Erro ao tentar navegar via JavaScript: {e}")
            
            logger.warning("Não foi possível encontrar o botão 'Anterior'")
            return False
            
        except Exception as e:
            logger.error(f"Erro ao tentar navegar para página anterior: {e}")
            return False
