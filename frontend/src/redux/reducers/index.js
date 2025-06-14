import { combineReducers } from "@reduxjs/toolkit";

// Sistema reducers
import authReducer from "./sistema/authReducer";

// Aplicação reducers
import publicacaoReducer from "./aplicacao/publicacaoReducer";

export default combineReducers({
  // Sistema
  auth: authReducer,

  // Aplicação
  publicacao: publicacaoReducer,
});
