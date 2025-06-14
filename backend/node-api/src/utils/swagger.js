const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

// Configuração básica do Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API JustCash - DJE-SP",
      version: "1.0.0",
      description: "API para gerenciamento de publicações do Diário da Justiça Eletrônico de São Paulo",
      contact: {
        name: "Suporte JustCash",
        email: "suporte@justcash.com.br"
      },
      license: {
        name: "Proprietária",
        url: "https://justcash.com.br"
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production" 
          ? "https://api.justcash.com.br" 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === "production" ? "Servidor de Produção" : "Servidor de Desenvolvimento"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    "./src/routes/*.js",
    "./src/models/sistema/*.js",
    "./src/models/aplicacao/*.js"
  ]
};

const specs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, specs }; 