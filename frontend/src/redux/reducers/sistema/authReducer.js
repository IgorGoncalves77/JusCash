import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  registerUser,
  getCurrentUserAction,
  refreshTokenAction,
  forgotPasswordAction,
  resetPasswordAction,
} from "../../actions/sistema/authActions";

const initialState = {
  token: localStorage.getItem("token"),
  usuario: localStorage.getItem("usuario")
    ? JSON.parse(localStorage.getItem("usuario"))
    : null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      state.token = null;
      state.usuario = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { token, usuario } = action.payload;
      state.token = token;
      state.usuario = usuario;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.usuario = action.payload.usuario;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.token = null;
        state.usuario = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload?.mensagem || "Erro ao fazer login";
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.usuario = action.payload.usuario;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.token = null;
        state.usuario = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload?.mensagem || "Erro ao registrar usuário";
      })

      // Get Current User
      .addCase(getCurrentUserAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUserAction.fulfilled, (state, action) => {
        state.usuario = action.payload.usuario;
        state.loading = false;
      })
      .addCase(getCurrentUserAction.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.mensagem || "Erro ao obter dados do usuário";
      })

      // Refresh Token
      .addCase(refreshTokenAction.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshTokenAction.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.usuario = action.payload.usuario;
        state.loading = false;
      })
      .addCase(refreshTokenAction.rejected, (state, action) => {
        state.token = null;
        state.usuario = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload?.mensagem || "Erro ao renovar token";
      })

      // Forgot Password
      .addCase(forgotPasswordAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordAction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPasswordAction.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.mensagem || "Erro ao processar solicitação";
      })

      // Reset Password
      .addCase(resetPasswordAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordAction.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPasswordAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.mensagem || "Erro ao redefinir senha";
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
