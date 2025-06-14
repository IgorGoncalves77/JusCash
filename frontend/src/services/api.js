import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptador para incluir o token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador de resposta para tratamento de erros de autenticação e rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tratamento para erro 429 (Too Many Requests) - implementar retry com backoff exponencial
    if (error.response && error.response.status === 429) {
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++;

        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
        console.log(
          `Erro 429 - Tentativa ${originalRequest._retryCount} - Aguardando ${delay}ms`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));

        return api(originalRequest);
      }
    }

    // Logout automático em caso de token expirado/inválido
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      if (!window.location.pathname.includes("/login")) {
        window.location = "/login";
      }
    }

    return Promise.reject(error);
  }
);

//--------------------Autenticação--------------------//
export async function login(data) {
  try {
    const response = await api.post("/auth/login", data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function register(data) {
  try {
    const response = await api.post("/auth/registro", data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function refreshToken(token) {
  try {
    const response = await api.post("/auth/refresh-token", { token });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function forgotPassword(data) {
  try {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function resetPassword(data) {
  try {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

//--------------------Publicações--------------------//
export async function getPublicacoes(status, page = 1, filters = {}) {
  try {
    const { limit = 50, ...restFilters } = filters;
    const params = {
      page,
      limit,
    };
    if (restFilters.textoPesquisa) {
      params.textoPesquisa = restFilters.textoPesquisa;
    }
    if (restFilters.dataInicio) {
      params.dataInicio = restFilters.dataInicio;
    }
    if (restFilters.dataFim) {
      params.dataFim = restFilters.dataFim;
    }
    const response = await api.get(`/publicacoes/status/${status}`, { params });

    return response.data;
  } catch (error) {
    console.error(`Erro na API getPublicacoes (${status}):`, error);
    throw error;
  }
}

export async function getPublicacao(id) {
  try {
    const response = await api.get(`/publicacoes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`API: Erro ao buscar publicação ${id}:`, error);
    throw error;
  }
}

export async function createPublicacao(data) {
  try {
    const response = await api.post("/publicacoes", data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updatePublicacao(id, data) {
  try {
    const response = await api.put(`/publicacoes/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updatePublicacaoStatus(id, status) {
  try {
    const response = await api.put(`/publicacoes/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deletePublicacao(id) {
  try {
    const response = await api.delete(`/publicacoes/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getPublicacoesEstatisticas() {
  try {
    const response = await api.get("/publicacoes/estatisticas");
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getPublicacoesByDateRange(inicio, fim) {
  try {
    const response = await api.get(`/publicacoes/data/${inicio}/${fim}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getPublicacoesByProcesso(numero) {
  try {
    const response = await api.get(`/publicacoes/processo/${numero}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

//--------------------Usuários--------------------//
export async function getUsuarios() {
  try {
    const response = await api.get("/usuarios");
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getUsuario(id) {
  try {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createUsuario(data) {
  try {
    const response = await api.post("/usuarios", data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateUsuario(id, data) {
  try {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteUsuario(id) {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export default api;
