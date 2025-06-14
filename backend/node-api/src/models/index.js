const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../configdb");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  logging: false,
  define: {
    timestamps: false,
  },
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

// Função para criar tabela se não existir e aplicar alterações se necessário
const setupTable = async (model, schema) => {
  try {
    await model.sync({ schema, force: false, alter: true });
  } catch (error) {
    console.error(
      `Erro ao criar/alterar a tabela ${model.getTableName()}:`,
      error
    );
  }
};

// Importar e inicializar modelos de sistema
db.Usuario = require("./sistema/Usuario")(sequelize, DataTypes, "public");

// Importar e inicializar modelos de aplicação
db.Publicacao = require("./aplicacao/Publicacao")(
  sequelize,
  DataTypes,
  "public"
);

// Definir associações entre modelos
Object.keys(db).forEach((modelName) => {
  if (db[modelName] && db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Configurar a sincronização do banco de dados - será chamada pelo app.js
db.setupDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso.");

    const syncModels = async () => {
      await setupTable(db.Usuario, "public");
      await setupTable(db.Publicacao, "public");
    };

    await syncModels();
    console.log("✅ Tabelas sincronizadas com sucesso.");
    return true;
  } catch (error) {
    console.error("❌ Falha ao sincronizar banco de dados:", error);
    throw error;
  }
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
