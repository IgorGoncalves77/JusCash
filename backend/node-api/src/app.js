const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import database and models
const db = require("./models");

// Import middleware and utils
const { errorHandler } = require("./middleware/errorHandler");
const { swaggerUi, specs } = require("./utils/swagger");

// Initialize app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.set("trust proxy", 1);
app.use(
  helmet({
    // Desabilitar contentSecurityPolicy para desenvolvimento
    contentSecurityPolicy: process.env.NODE_ENV === "production",
    // Permitir frames da mesma origem
    frameguard: {
      action: "sameorigin",
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Middleware para restringir requests em favicon.ico para não logar
app.use((req, res, next) => {
  if (req.originalUrl === "/favicon.ico") {
    res.status(204).end();
    return;
  }
  next();
});

// Configuração do logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Adicionar timestamp nas requests
app.use((req, res, next) => {
  req.timestamp = new Date().toISOString();
  next();
});

// Compression
app.use(compression());

// Configuração CORS
app.use(
  cors({
    origin: [
      "https://juscash.app.br",
      "https://www.juscash.app.br",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    credentials: true,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Aumentado de 100 para 500 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // Não aplicar o rate limiter às rotas de publicações
  skip: (req) => {
    return req.originalUrl.includes("/api/publicacoes");
  },
});

// Apply rate limiting to all routes
app.use(limiter);

// Parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware para desativar cache nas rotas da API
app.use("/api", (req, res, next) => {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Last-Modified": new Date().toUTCString(),
  });
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    sucesso: true,
    mensagem: "API JustCash funcionando",
    timestamp: req.timestamp,
    ambiente: process.env.NODE_ENV || "development",
  });
});

// Setup routes
require("./routes")(app);

// Documentação Swagger
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../../frontend/build", "index.html"));
  });
}

// Middleware de tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: "Rota não encontrada",
    rota: req.originalUrl,
    timestamp: req.timestamp,
  });
});

// Iniciar o servidor após a sincronização do banco de dados
const startServer = async () => {
  try {
    await db.setupDatabase();

    // Create admin user if none exists
    const adminExists = await db.Usuario.findOne({
      where: { perfil: "admin" },
    });

    if (!adminExists) {
      await db.Usuario.create({
        nome: "Administrador",
        email: "admin@juscash.com.br",
        senha: "Admin@123",
        perfil: "admin",
      });
      console.log("✅ Usuário administrador padrão criado");
    }

    // Start node-api
    const servidor = app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("📶 SIGTERM recebido, fechando servidor...");
      servidor.close(() => {
        console.log("🔒 Servidor fechado");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("📶 SIGINT recebido, fechando servidor...");
      servidor.close(() => {
        console.log("🔒 Servidor fechado");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Falha ao iniciar servidor:", error);
    process.exit(1);
  }
};

// Iniciar servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

module.exports = app;
