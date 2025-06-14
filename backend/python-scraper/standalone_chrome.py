import os
import platform
import zipfile
import urllib.request
import logging
import sys
import subprocess
import json
from urllib.error import HTTPError

logger = logging.getLogger("DJE_Scraper")

def get_chrome_version():
    """Obtém a versão do Chrome instalado"""
    try:
        system = platform.system()
        
        if system == "Windows":
            # Windows - verifica a versão do Chrome via PowerShell
            cmd = r'powershell -command "& {(Get-Item -Path \"$env:PROGRAMFILES\Google\Chrome\Application\chrome.exe\" -ErrorAction SilentlyContinue).VersionInfo.FileVersion -replace \",\", \".\"}"'
            output = subprocess.check_output(cmd, shell=True).decode('utf-8').strip()
            
            if not output or "não foi possível" in output.lower():
                # Tenta o diretório alternativo do Chrome
                cmd = r'powershell -command "& {(Get-Item -Path \"$env:PROGRAMFILES (x86)\Google\Chrome\Application\chrome.exe\" -ErrorAction SilentlyContinue).VersionInfo.FileVersion -replace \",\", \".\"}"'
                output = subprocess.check_output(cmd, shell=True).decode('utf-8').strip()
            
            return output.split('.')[0] if output else None
            
        elif system == "Linux":
            # Linux - verifica a versão do Chrome
            cmd = "google-chrome --version"
            output = subprocess.check_output(cmd, shell=True).decode('utf-8')
            return output.strip().split(' ')[2].split('.')[0]
            
        elif system == "Darwin":
            # macOS - verifica a versão do Chrome
            cmd = r"/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version"
            output = subprocess.check_output(cmd, shell=True).decode('utf-8')
            return output.strip().split(' ')[2].split('.')[0]
            
        else:
            logger.error(f"Sistema operacional não suportado: {system}")
            return None
            
    except Exception as e:
        logger.error(f"Erro ao obter versão do Chrome: {e}")
        return None

def get_latest_chromedriver_version(chrome_version):
    """
    Obtém a versão mais recente do ChromeDriver compatível com a versão do Chrome
    """
    try:
        # URL da API que fornece as versões disponíveis do ChromeDriver
        url = f"https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json"
        
        # Faz a requisição para a API
        with urllib.request.urlopen(url) as response:
            versions_data = json.loads(response.read().decode())
            
        # Filtra as versões que correspondem à versão major do Chrome
        matching_versions = []
        for version_entry in versions_data.get("versions", []):
            version = version_entry.get("version", "")
            if version.startswith(f"{chrome_version}."):
                matching_versions.append(version)
        
        # Retorna a versão mais recente (última da lista, se estiverem ordenadas)
        if matching_versions:
            return matching_versions[-1]
        else:
            # Se não encontrar uma versão específica, retorna a última versão disponível
            return versions_data.get("versions", [])[-1].get("version")
    
    except Exception as e:
        logger.error(f"Erro ao obter versão do ChromeDriver: {e}")
        return None

def download_chromedriver(chrome_version):
    """
    Baixa o ChromeDriver compatível com a versão do Chrome
    """
    system = platform.system()
    architecture = platform.architecture()[0]
    
    # Define o diretório para salvar o ChromeDriver
    driver_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drivers")
    os.makedirs(driver_dir, exist_ok=True)
    
    # Determina a plataforma para download
    if system == "Windows":
        # No Windows, usa win32 para 32 bits ou win64 para 64 bits
        platform_name = "win32" if architecture == "32bit" else "win64"
        driver_name = "chromedriver.exe"
    elif system == "Linux":
        platform_name = "linux64"
        driver_name = "chromedriver"
    elif system == "Darwin":
        # No macOS, determina a arquitetura
        if architecture == "64bit" and platform.processor() == "arm":
            platform_name = "mac-arm64"
        else:
            platform_name = "mac-x64"
        driver_name = "chromedriver"
    else:
        logger.error(f"Sistema operacional não suportado para download: {system}")
        return None
    
    # Obtém a versão mais recente do ChromeDriver compatível
    exact_version = get_latest_chromedriver_version(chrome_version)
    if not exact_version:
        logger.error("Não foi possível obter a versão compatível do ChromeDriver")
        return None
    
    # Constrói a URL de download baseada na versão do Chrome
    download_url = f"https://storage.googleapis.com/chrome-for-testing-public/{exact_version}/{platform_name}/chromedriver-{platform_name}.zip"
    
    driver_path = os.path.join(driver_dir, driver_name)
    zip_path = os.path.join(driver_dir, f"chromedriver_{chrome_version}.zip")
    
    try:
        # Baixa o arquivo zip
        logger.info(f"Baixando ChromeDriver da URL: {download_url}")
        urllib.request.urlretrieve(download_url, zip_path)
        
        # Extrai o arquivo zip
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Lista o conteúdo do zip para encontrar o caminho correto do chromedriver
            file_list = zip_ref.namelist()
            chromedriver_path = None
            for file_path in file_list:
                if file_path.endswith(driver_name):
                    chromedriver_path = file_path
                    break
            
            if not chromedriver_path:
                logger.error(f"Chromedriver não encontrado no arquivo zip")
                return None
                
            # Extrai apenas o arquivo chromedriver para o diretório final
            source = zip_ref.open(chromedriver_path)
            target = open(driver_path, "wb")
            target.write(source.read())
            target.close()
            source.close()
        
        # No Linux e macOS, torna o ChromeDriver executável
        if system != "Windows":
            os.chmod(driver_path, 0o755)
        
        logger.info(f"ChromeDriver baixado e extraído com sucesso em {driver_path}")
        return driver_path
        
    except HTTPError as e:
        logger.error(f"Erro HTTP ao baixar o ChromeDriver: {e}")
        if e.code == 404:
            logger.info("Tentando versão alternativa...")
            # Tenta baixar a última versão disponível como fallback
            try:
                alt_url = "https://storage.googleapis.com/chrome-for-testing-public/LATEST_RELEASE"
                with urllib.request.urlopen(alt_url) as response:
                    latest_version = response.read().decode().strip()
                    
                alt_download_url = f"https://storage.googleapis.com/chrome-for-testing-public/{latest_version}/{platform_name}/chromedriver-{platform_name}.zip"
                logger.info(f"Tentando URL alternativa: {alt_download_url}")
                urllib.request.urlretrieve(alt_download_url, zip_path)
                
                # Extrai o arquivo zip
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    # Lista o conteúdo do zip para encontrar o caminho correto do chromedriver
                    file_list = zip_ref.namelist()
                    chromedriver_path = None
                    for file_path in file_list:
                        if file_path.endswith(driver_name):
                            chromedriver_path = file_path
                            break
                    
                    if not chromedriver_path:
                        logger.error(f"Chromedriver não encontrado no arquivo zip")
                        return None
                        
                    # Extrai apenas o arquivo chromedriver para o diretório final
                    source = zip_ref.open(chromedriver_path)
                    target = open(driver_path, "wb")
                    target.write(source.read())
                    target.close()
                    source.close()
                
                # No Linux e macOS, torna o ChromeDriver executável
                if system != "Windows":
                    os.chmod(driver_path, 0o755)
                
                logger.info(f"ChromeDriver (versão alternativa) baixado e extraído com sucesso em {driver_path}")
                return driver_path
            except Exception as e2:
                logger.error(f"Erro ao baixar versão alternativa: {e2}")
                return None
        return None
    except Exception as e:
        logger.error(f"Erro ao baixar ou extrair o ChromeDriver: {e}")
        return None

def get_chromedriver_path():
    """
    Retorna o caminho para o ChromeDriver adequado à versão do Chrome instalado
    """
    # Obtém a versão do Chrome
    chrome_version = get_chrome_version()
    if not chrome_version:
        logger.error("Não foi possível determinar a versão do Chrome")
        return None
    
    logger.info(f"Versão do Chrome detectada: {chrome_version}")
    
    # Define o diretório e o nome do driver
    driver_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drivers")
    
    if platform.system() == "Windows":
        driver_name = "chromedriver.exe"
    else:
        driver_name = "chromedriver"
    
    driver_path = os.path.join(driver_dir, driver_name)
    
    # Verifica se o driver já existe
    if os.path.exists(driver_path):
        logger.info(f"ChromeDriver encontrado em {driver_path}")
        return driver_path
    
    # Se não existir, baixa o driver compatível
    return download_chromedriver(chrome_version) 