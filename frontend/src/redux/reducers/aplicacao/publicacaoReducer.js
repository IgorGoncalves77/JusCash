import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPublicacao,
  updatePublicacaoStatusAction,
  fetchPublicacoesByProcesso,
} from "../../actions/aplicacao/publicacaoActions";

const updateArraysForStatus = (state, status, publicacoes) => {
  switch (status) {
    case "nova":
      state.publicacoesNovas = publicacoes;
      break;
    case "lida":
      state.publicacoesLidas = publicacoes;
      break;
    case "enviada":
      state.publicacoesEnviadas = publicacoes;
      break;
    case "processada":
      state.publicacoesConcluidas = publicacoes;
      break;
    default:
      break;
  }
};

// Função auxiliar para adicionar mais publicações aos arrays existentes
const appendToArraysForStatus = (state, status, publicacoes) => {
  switch (status) {
    case "nova":
      state.publicacoesNovas = [...state.publicacoesNovas, ...publicacoes];
      break;
    case "lida":
      state.publicacoesLidas = [...state.publicacoesLidas, ...publicacoes];
      break;
    case "enviada":
      state.publicacoesEnviadas = [
        ...state.publicacoesEnviadas,
        ...publicacoes,
      ];
      break;
    case "processada":
      state.publicacoesConcluidas = [
        ...state.publicacoesConcluidas,
        ...publicacoes,
      ];
      break;
    default:
      break;
  }
};

const initialState = {
  loading: false,
  error: null,
  publicacoesNovas: [],
  publicacoesLidas: [],
  publicacoesEnviadas: [],
  publicacoesConcluidas: [],
  publicacaoAtual: null,
  paginacao: {
    nova: { pagina: 1, totalPaginas: 1, total: 0 },
    lida: { pagina: 1, totalPaginas: 1, total: 0 },
    enviada: { pagina: 1, totalPaginas: 1, total: 0 },
    processada: { pagina: 1, totalPaginas: 1, total: 0 },
  },
};

const publicacaoSlice = createSlice({
  name: "publicacao",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ==================== FETCH PUBLICAÇÕES ====================
      .addCase("publicacoes/fetchRequest", (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase("publicacoes/fetchSuccess", (state, action) => {
        const { status, publicacoes, paginacao } = action.payload;

        state.loading = false;
        state.error = null;

        updateArraysForStatus(state, status, publicacoes);

        state.paginacao[status] = {
          pagina: paginacao.currentPage,
          totalPaginas: paginacao.totalPages,
          total: paginacao.total,
        };
      })
      .addCase("publicacoes/appendSuccess", (state, action) => {
        const { status, publicacoes, paginacao } = action.payload;

        state.loading = false;
        state.error = null;

        appendToArraysForStatus(state, status, publicacoes);

        state.paginacao[status] = {
          pagina: paginacao.currentPage,
          totalPaginas: paginacao.totalPages,
          total: paginacao.total,
        };
      })
      .addCase("publicacoes/fetchFailure", (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
      })

      // ==================== FETCH PUBLICAÇÃO INDIVIDUAL ====================
      .addCase(fetchPublicacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicacao.fulfilled, (state, action) => {
        console.log("Reducer: Recebido payload de publicação:", action.payload);

        state.publicacaoAtual = action.payload;
        state.error = null;
        state.loading = false;
      })
      .addCase(fetchPublicacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.mensagem || "Erro ao carregar publicação";
        state.publicacaoAtual = null;
      })

      // ==================== UPDATE STATUS ====================
      .addCase(updatePublicacaoStatusAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePublicacaoStatusAction.fulfilled, (state, action) => {
        const { id, status } = action.payload;

        // Remover da lista atual e adicionar à nova lista
        const listas = [
          "publicacoesNovas",
          "publicacoesLidas",
          "publicacoesEnviadas",
          "publicacoesConcluidas",
        ];
        let publicacaoMovida = null;

        // Encontrar e remover da lista atual
        listas.forEach((lista) => {
          const index = state[lista].findIndex((p) => p.id === id);
          if (index !== -1) {
            publicacaoMovida = state[lista].splice(index, 1)[0];
          }
        });

        // Adicionar à nova lista baseada no status
        if (publicacaoMovida) {
          publicacaoMovida.status = status;

          const statusMap = {
            nova: "publicacoesNovas",
            lida: "publicacoesLidas",
            enviada: "publicacoesEnviadas",
            processada: "publicacoesConcluidas",
          };

          const novaLista = statusMap[status];
          if (novaLista) {
            state[novaLista].unshift(publicacaoMovida);
          }
        }

        state.loading = false;
      })
      .addCase(updatePublicacaoStatusAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.mensagem || "Erro ao atualizar status";
      })

      // ==================== FETCH POR PROCESSO ====================
      .addCase(fetchPublicacoesByProcesso.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicacoesByProcesso.fulfilled, (state, action) => {
        state.loading = false;
        // Aqui você pode processar os resultados da busca por processo
      })
      .addCase(fetchPublicacoesByProcesso.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.mensagem || "Erro ao buscar por processo";
      });
  },
});

export default publicacaoSlice.reducer;
