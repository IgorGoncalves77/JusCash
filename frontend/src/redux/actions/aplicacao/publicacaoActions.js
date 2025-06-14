import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getPublicacoes,
  getPublicacao,
  createPublicacao,
  updatePublicacao,
  updatePublicacaoStatus,
  deletePublicacao,
  getPublicacoesEstatisticas,
  getPublicacoesByDateRange,
  getPublicacoesByProcesso,
} from "../../../services/api";

export function fetchPublicacoes({
  status = "nova",
  page = 1,
  limit = 50,
  filters = {},
  shouldAppend = false,
}) {
  return async (dispatch, getState) => {
    dispatch({
      type: "publicacoes/fetchRequest",
      payload: { status },
    });

    try {
      console.log(
        `Buscando publicações - Status: ${status}, Página: ${page}, Filtros:`,
        filters
      );

      const data = await getPublicacoes(status, page, { limit, ...filters });

      const publicacoes = data.publicacoes || [];
      const paginacao = data.pagination || {
        total: 0,
        totalPages: 0,
        currentPage: page,
      };

      console.log(
        `Publicações recebidas (${status}) - Total: ${paginacao.total}, Página atual: ${paginacao.currentPage}/${paginacao.totalPages}, Registros: ${publicacoes.length}`
      );

      if (shouldAppend) {
        dispatch({
          type: "publicacoes/appendSuccess",
          payload: {
            status,
            publicacoes,
            paginacao,
          },
        });
      } else {
        dispatch({
          type: "publicacoes/fetchSuccess",
          payload: {
            status,
            publicacoes,
            paginacao,
          },
        });
      }

      return { publicacoes, paginacao };
    } catch (error) {
      console.error(`Erro ao buscar publicações (${status}):`, error);

      dispatch({
        type: "publicacoes/fetchFailure",
        payload: {
          status,
          error: error.message || "Erro ao buscar publicações",
        },
      });

      throw error;
    }
  };
}

export const fetchPublicacao = createAsyncThunk(
  "publicacoes/fetchById",
  async (id, thunkAPI) => {
    try {
      console.log(`Buscando detalhes da publicação com ID: ${id}`);
      const response = await getPublicacao(id);
      console.log(`Resposta recebida para publicação ${id}:`, response);
      return response.publicacao || response; // Garantir que retorne sempre publicacao
    } catch (error) {
      console.error(`Erro ao buscar publicação ${id}:`, error);
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);

export const createPublicacaoAction = createAsyncThunk(
  "publicacoes/create",
  async (data, thunkAPI) => {
    try {
      const response = await createPublicacao(data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);

export const updatePublicacaoAction = createAsyncThunk(
  "publicacoes/update",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await updatePublicacao(id, data);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);

export const updatePublicacaoStatusAction = createAsyncThunk(
  "publicacoes/updateStatus",
  async ({ id, status }, thunkAPI) => {
    try {
      const response = await updatePublicacaoStatus(id, status);
      return { id, status, publicacao: response };
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);

export const deletePublicacaoAction = createAsyncThunk(
  "publicacoes/delete",
  async (id, thunkAPI) => {
    try {
      await deletePublicacao(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);

export const fetchPublicacoesEstatisticas = createAsyncThunk(
  "publicacoes/fetchEstatisticas",
  async (_, thunkAPI) => {
    try {
      const response = await getPublicacoesEstatisticas();
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);

export const fetchPublicacoesByDateRange = createAsyncThunk(
  "publicacoes/fetchByDateRange",
  async ({ inicio, fim }, thunkAPI) => {
    try {
      const response = await getPublicacoesByDateRange(inicio, fim);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);

export const fetchPublicacoesByProcesso = createAsyncThunk(
  "publicacoes/fetchByProcesso",
  async (numero, thunkAPI) => {
    try {
      const response = await getPublicacoesByProcesso(numero);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || error.message,
      });
    }
  }
);
