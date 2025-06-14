import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  login as loginAPI,
  register as registerAPI,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  resetPassword,
} from "../../../services/api";

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, senha }, thunkAPI) => {
    try {
      const response = await loginAPI({ email, senha });

      localStorage.setItem("token", response.token);
      localStorage.setItem("usuario", JSON.stringify(response.usuario));

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem:
          error.response?.data?.mensagem ||
          "Erro ao fazer login. Tente novamente.",
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ nome, email, senha }, thunkAPI) => {
    try {
      const response = await registerAPI({ nome, email, senha });

      localStorage.setItem("token", response.token);
      localStorage.setItem("usuario", JSON.stringify(response.usuario));

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem:
          error.response?.data?.mensagem ||
          "Erro ao registrar usuário. Tente novamente.",
      });
    }
  }
);

export const getCurrentUserAction = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, thunkAPI) => {
    try {
      const response = await getCurrentUser();
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem:
          error.response?.data?.mensagem || "Erro ao obter dados do usuário.",
      });
    }
  }
);

export const refreshTokenAction = createAsyncThunk(
  "auth/refreshToken",
  async (token, thunkAPI) => {
    try {
      const response = await refreshToken(token);

      localStorage.setItem("token", response.token);
      localStorage.setItem("usuario", JSON.stringify(response.usuario));

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || "Erro ao renovar token.",
      });
    }
  }
);

export const forgotPasswordAction = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, thunkAPI) => {
    try {
      const response = await forgotPassword({ email });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem:
          error.response?.data?.mensagem ||
          "Erro ao processar solicitação de recuperação de senha.",
      });
    }
  }
);

export const resetPasswordAction = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, senha, confirmacaoSenha }, thunkAPI) => {
    try {
      const response = await resetPassword({ token, senha, confirmacaoSenha });
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        mensagem: error.response?.data?.mensagem || "Erro ao redefinir senha.",
      });
    }
  }
);

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");

  return {
    type: "auth/logout",
  };
};

export const verificarAuth = () => (dispatch) => {
  const token = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");

  if (token && usuario) {
    dispatch({
      type: "auth/setCredentials",
      payload: {
        token,
        usuario: JSON.parse(usuario),
      },
    });
    return true;
  }

  return false;
};
