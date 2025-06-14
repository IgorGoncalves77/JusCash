const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes, schema = "public") => {
  const Usuario = sequelize.define(
    "usuario",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      senha: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      perfil: {
        type: DataTypes.ENUM("admin", "usuario", "visualizador"),
        allowNull: false,
        defaultValue: "visualizador",
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      data_criacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      data_atualizacao: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ultimo_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      token_reset_senha: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      expiracao_token_reset: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "usuarios",
      schema: schema,
      timestamps: true,
      createdAt: "data_criacao",
      updatedAt: "data_atualizacao",
      hooks: {
        beforeCreate: async (usuario) => {
          if (usuario.senha) {
            const salt = await bcrypt.genSalt(10);
            usuario.senha = await bcrypt.hash(usuario.senha, salt);
          }
        },
        beforeUpdate: async (usuario) => {
          if (usuario.changed("senha")) {
            const salt = await bcrypt.genSalt(10);
            usuario.senha = await bcrypt.hash(usuario.senha, salt);
          }
        },
      },
    }
  );

  // Método para verificar senha
  Usuario.prototype.verificarSenha = async function (senhaFornecida) {
    return await bcrypt.compare(senhaFornecida, this.senha);
  };

  // Método para transformar o objeto em JSON sem a senha
  Usuario.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.senha;
    return values;
  };

  // Associações com outros modelos (se necessário)
  Usuario.associate = function (models) {
    // Definir associações aqui
  };

  return Usuario;
};
