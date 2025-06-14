const jwt = require("jsonwebtoken");
const db = require("../models");

// Middleware para autenticar usuário
exports.authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message:
          "Acesso não autorizado. Token não fornecido ou em formato inválido.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await db.Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        message: "Usuário não encontrado ou token inválido.",
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        message:
          "Sua conta está desativada. Entre em contato com o administrador.",
      });
    }

    req.user = usuario;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Sua sessão expirou. Por favor, faça login novamente.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token inválido. Por favor, faça login novamente.",
      });
    }

    console.error("Erro na autenticação:", error);
    return res.status(500).json({
      message: "Erro interno no servidor ao validar autenticação.",
    });
  }
};

// Middleware para verificar se o usuário é administrador
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.perfil !== "admin") {
    return res.status(403).json({
      message: "Acesso restrito a administradores.",
    });
  }
  next();
};

// Middleware para verificar se o usuário é admin ou o próprio usuário
exports.adminOrSelf = (req, res, next) => {
  const userId = parseInt(req.params.id);

  if (!req.user || (req.user.perfil !== "admin" && req.user.id !== userId)) {
    return res.status(403).json({
      message: "Você não tem permissão para acessar este recurso.",
    });
  }

  next();
};
