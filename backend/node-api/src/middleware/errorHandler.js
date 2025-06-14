// Middleware para tratamento centralizado de erros
exports.errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err);

  // Sequelize validation errors
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      message: "Erro de validação",
      errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Token inválido. Por favor, faça login novamente.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Sua sessão expirou. Por favor, faça login novamente.",
    });
  }

  // Handle custom application errors
  if (err.isApplicationError) {
    return res.status(err.statusCode || 400).json({
      message: err.message,
    });
  }

  // Handle errors thrown with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message || "Ocorreu um erro na requisição",
    });
  }

  // Default to 500 server error
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Erro interno no servidor"
        : err.message || "Erro interno no servidor",
  });
};

// Função para criar erros customizados na aplicação
exports.createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isApplicationError = true;
  return error;
};

// Função para tratamento assíncrono - evita try/catch em controllers
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
