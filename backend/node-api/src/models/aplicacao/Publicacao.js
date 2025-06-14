const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes, schema = "public") => {
  const Publicacao = sequelize.define(
    "publicacao",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      numeroProcesso: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "numero_processo",
      },
      dataDisponibilizacao: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "data_disponibilizacao",
      },
      autor: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reu: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "Instituto Nacional do Seguro Social - INSS",
      },
      advogado: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      valorPrincipal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "valor_principal",
      },
      valorJurosMoratorios: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "valor_juros_moratorios",
      },
      honorariosAdvocaticios: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: "honorarios_advocaticios",
      },
      conteudoCompleto: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "conteudo_completo",
      },
      status: {
        type: DataTypes.ENUM("nova", "lida", "enviada", "processada"),
        allowNull: false,
        defaultValue: "nova",
      },
      dataCriacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "data_criacao",
      },
      dataAtualizacao: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "data_atualizacao",
      },
    },
    {
      tableName: "publicacoes",
      schema: schema,
      timestamps: true,
      createdAt: "dataCriacao",
      updatedAt: "dataAtualizacao",
    }
  );

  // Métodos de instância
  Publicacao.prototype.atualizarStatus = function (novoStatus) {
    const statusesValidos = ["nova", "lida", "enviada", "processada"];

    if (!statusesValidos.includes(novoStatus)) {
      throw new Error(
        `Status inválido. Os valores aceitos são: ${statusesValidos.join(", ")}`
      );
    }

    return this.update({ status: novoStatus });
  };

  // Associações com outros modelos (se necessário)
  Publicacao.associate = function (models) {
    // Definir associações aqui
  };

  return Publicacao;
};
