import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { verificarAuth } from "./redux/actions/sistema/authActions";
import theme from "./themes";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Kanban } from "./pages/Kanban";

// Componente de rota protegida
const RotaProtegida = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente de rota pública (redireciona se já estiver autenticado)
const RotaPublica = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/kanban" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(verificarAuth());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <RotaPublica>
                <Login />
              </RotaPublica>
            }
          />
          <Route
            path="/cadastro"
            element={
              <RotaPublica>
                <Cadastro />
              </RotaPublica>
            }
          />

          <Route
            path="/kanban"
            element={
              <RotaProtegida>
                <Kanban />
              </RotaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
