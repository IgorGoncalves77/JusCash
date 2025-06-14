module.exports = (app) => {
  const express = require("express");
  const router = express.Router();
  const fs = require("fs");
  const path = require("path");

  const controllers = require("../controllers");
  const auth = require("../middleware/auth");
  const { errorHandler } = require("../middleware/errorHandler");

  // Aplicar middleware de tratamento de erros
  router.use(errorHandler);

  //--------------------ROTAS DE AUTENTICAÇÃO--------------------//
  router.post("/auth/login", controllers.auth.login);
  router.post("/auth/registro", controllers.auth.registro);
  router.post("/auth/logout", controllers.auth.logout);
  router.get(
    "/auth/me",
    auth.authenticateUser,
    controllers.auth.getCurrentUser
  );
  router.post("/auth/refresh-token", controllers.auth.refreshToken);
  router.post("/auth/forgot-password", controllers.auth.forgotPassword);
  router.post("/auth/reset-password", controllers.auth.resetPassword);

  //--------------------ROTAS DE PUBLICAÇÕES--------------------//
  router.get(
    "/publicacoes",
    auth.authenticateUser,
    controllers.publicacao.findAll
  );
  router.get(
    "/publicacoes/estatisticas",
    auth.authenticateUser,
    controllers.publicacao.getEstatisticas
  );
  router.get(
    "/publicacoes/status/:status",
    auth.authenticateUser,
    controllers.publicacao.findByStatus
  );
  router.get(
    "/publicacoes/data/:inicio/:fim",
    auth.authenticateUser,
    controllers.publicacao.findByDateRange
  );
  router.get(
    "/publicacoes/processo/:numero",
    auth.authenticateUser,
    controllers.publicacao.findByProcesso
  );
  router.get(
    "/publicacoes/:id",
    auth.authenticateUser,
    controllers.publicacao.findOne
  );
  router.post(
    "/publicacoes",
    auth.authenticateUser,
    controllers.publicacao.create
  );
  router.put(
    "/publicacoes/:id",
    auth.authenticateUser,
    controllers.publicacao.update
  );
  router.put(
    "/publicacoes/:id/status",
    auth.authenticateUser,
    controllers.publicacao.updateStatus
  );
  router.delete(
    "/publicacoes/:id",
    auth.authenticateUser,
    auth.adminOnly,
    controllers.publicacao.delete
  );

  //--------------------ROTAS DE USUÁRIOS--------------------//
  router.get(
    "/usuarios",
    auth.authenticateUser,
    auth.adminOnly,
    controllers.user.findAll
  );
  router.get(
    "/usuarios/:id",
    auth.authenticateUser,
    auth.adminOrSelf,
    controllers.user.findOne
  );
  router.post(
    "/usuarios",
    auth.authenticateUser,
    auth.adminOnly,
    controllers.user.create
  );
  router.put(
    "/usuarios/:id",
    auth.authenticateUser,
    auth.adminOrSelf,
    controllers.user.update
  );
  router.delete(
    "/usuarios/:id",
    auth.authenticateUser,
    auth.adminOnly,
    controllers.user.delete
  );

  // Configuração para endpoints não encontrados
  router.use((req, res) => {
    res.status(404).json({ message: "Endpoint não encontrado" });
  });

  app.use("/api", router);
};
