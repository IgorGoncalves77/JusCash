/**
 * Validação de email
 * @param {string} email - Email para validar
 * @returns {boolean} - Verdadeiro se o email for válido
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Verifica se uma senha atende aos requisitos de segurança
 * @param {string} senha - Senha para validar
 * @returns {Object} Objeto com resultados de validação
 */
export const validarSenha = (senha) => {
  const resultado = {
    tamanhoMinimo: senha.length >= 8,
    temMaiuscula: /[A-Z]/.test(senha),
    temMinuscula: /[a-z]/.test(senha),
    temNumero: /[0-9]/.test(senha),
    temEspecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha),
    valida: false,
  };

  resultado.valida =
    resultado.tamanhoMinimo &&
    resultado.temMaiuscula &&
    resultado.temMinuscula &&
    resultado.temNumero &&
    resultado.temEspecial;

  return resultado;
};

/**
 * Verifica se duas senhas são iguais
 * @param {string} senha - Senha original
 * @param {string} confirmacao - Confirmação da senha
 * @returns {boolean} - Verdadeiro se as senhas forem iguais
 */
export const senhasIguais = (senha, confirmacao) => {
  return senha === confirmacao;
};

/**
 * Formata a data para exibição no padrão brasileiro
 * @param {string} dataString - Data em formato ISO ou string
 * @returns {string} - Data formatada (DD/MM/YYYY)
 */
export const formatarData = (dataString) => {
  if (!dataString) return "";

  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR");
};

/**
 * Calcula o tempo decorrido desde uma data e retorna em formato simplificado
 * @param {string} dataString - Data em formato ISO ou string
 * @returns {string} - Tempo decorrido (ex: "3h", "2d", "30d")
 */
export const calcularTempoDecorrido = (dataString) => {
  if (!dataString) return "";

  const dataPassada = new Date(dataString);
  const agora = new Date();

  const diffMs = agora - dataPassada;

  const minutos = Math.floor(diffMs / (1000 * 60));
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutos < 60) {
    return `${minutos}m`;
  } else if (horas < 24) {
    return `${horas}h`;
  } else {
    return `${dias}d`;
  }
};

/**
 * Formata um valor monetário
 * @param {number} valor - Valor a ser formatado
 * @returns {string} - Valor formatado como moeda brasileira
 */
export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

/**
 * Trunca um texto para um tamanho máximo
 * @param {string} texto - Texto a ser truncado
 * @param {number} tamanho - Tamanho máximo do texto
 * @returns {string} - Texto truncado com reticências
 */
export const truncarTexto = (texto, tamanho = 100) => {
  if (!texto) return "";

  if (texto.length <= tamanho) return texto;

  return texto.substring(0, tamanho) + "...";
};
