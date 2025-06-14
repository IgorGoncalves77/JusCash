const { Publicacao } = require("../../models");
const { Op } = require("sequelize");

module.exports = {
  async findAll(req, res) {
    try {
      const page = req.query.pagina || req.query.page || 1;
      const limit = req.query.limite || req.query.limit || 50;
      const sort = req.query.sort || "dataCriacao";
      const order = req.query.order || "DESC";

      const offset = (page - 1) * limit;

      const { count, rows: publicacoes } = await Publicacao.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order]],
      });

      const totalPages = Math.ceil(count / limit);

      const response = {
        success: true,
        publicacoes: publicacoes || [],
        pagination: {
          total: count || 0,
          totalPages: totalPages || 0,
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
        timestamp: new Date().toISOString(),
      };

      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("Erro ao buscar publicações:", error);

      const page = req.query.pagina || req.query.page || 1;
      const limit = req.query.limite || req.query.limit || 50;

      const errorResponse = {
        success: false,
        error: "Erro ao buscar publicações",
        publicacoes: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
        timestamp: new Date().toISOString(),
      };

      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      return res.status(500).json(errorResponse);
    }
  },

  async findOne(req, res) {
    try {
      const { id } = req.params;

      const publicacao = await Publicacao.findByPk(id);

      if (!publicacao) {
        return res.status(404).json({
          success: false,
          error: "Publicação não encontrada",
        });
      }

      return res.status(200).json({
        success: true,
        publicacao: publicacao,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        `Backend: Erro ao buscar publicação ${req.params.id}:`,
        error
      );
      return res.status(400).json({
        success: false,
        error: "Erro ao buscar publicação.",
      });
    }
  },

  async create(req, res) {
    try {
      const {
        numeroProcesso,
        dataDisponibilizacao,
        autor,
        reu,
        advogado,
        conteudoCompleto,
        valorPrincipal,
        valorJurosMoratorios,
        honorariosAdvocaticios,
      } = req.body;

      if (!numeroProcesso) {
        return res
          .status(400)
          .json({ error: "Número do processo é obrigatório" });
      }

      const publicacao = await Publicacao.create({
        numeroProcesso,
        dataDisponibilizacao: dataDisponibilizacao || new Date(),
        autor,
        reu,
        advogado,
        conteudoCompleto,
        valorPrincipal,
        valorJurosMoratorios,
        honorariosAdvocaticios,
        status: "nova",
        dataCriacao: new Date(),
        usuarioCriacao: req.user ? req.user.nome || req.user.email : "Sistema",
      });

      return res.status(201).json({
        message: "Publicação criada com sucesso",
        publicacao,
      });
    } catch (error) {
      console.error("Erro ao criar publicação:", error);
      return res.status(400).json({ error: "Erro ao criar publicação." });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const dadosAtualizacao = req.body;

      const publicacao = await Publicacao.findByPk(id);

      if (!publicacao) {
        return res.status(404).json({ error: "Publicação não encontrada" });
      }

      dadosAtualizacao.dataAtualizacao = new Date();
      dadosAtualizacao.usuarioAtualizacao = req.user
        ? req.user.nome || req.user.email
        : "Sistema";

      await publicacao.update(dadosAtualizacao);

      const publicacaoAtualizada = await Publicacao.findByPk(id);

      return res.status(200).json({
        message: "Publicação atualizada com sucesso",
        publicacao: publicacaoAtualizada,
      });
    } catch (error) {
      console.error("Erro ao atualizar publicação:", error);
      return res.status(400).json({ error: "Erro ao atualizar publicação." });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      const publicacao = await Publicacao.findByPk(id);

      if (!publicacao) {
        return res.status(404).json({ error: "Publicação não encontrada" });
      }

      await publicacao.destroy();

      return res.status(200).json({
        message: "Publicação excluída com sucesso",
      });
    } catch (error) {
      console.error("Erro ao excluir publicação:", error);
      return res.status(400).json({ error: "Erro ao excluir publicação." });
    }
  },

  async findByStatus(req, res) {
    try {
      const { status } = req.params;
      const pagina = req.query.pagina || req.query.page || 1;
      const limite = req.query.limite || req.query.limit || 50;

      const textoPesquisa = req.query.textoPesquisa || "";
      const dataInicio = req.query.dataInicio
        ? new Date(req.query.dataInicio)
        : null;
      const dataFim = req.query.dataFim ? new Date(req.query.dataFim) : null;

      if (dataFim) {
        dataFim.setHours(23, 59, 59, 999);
      }

      const offset = (pagina - 1) * limite;

      const whereConditions = { status };

      if (dataInicio && dataFim) {
        whereConditions.dataDisponibilizacao = {
          [Op.between]: [dataInicio, dataFim],
        };
      } else if (dataInicio) {
        whereConditions.dataDisponibilizacao = {
          [Op.gte]: dataInicio,
        };
      } else if (dataFim) {
        whereConditions.dataDisponibilizacao = {
          [Op.lte]: dataFim,
        };
      }

      if (textoPesquisa && textoPesquisa.trim() !== "") {
        const textoLike = `%${textoPesquisa.trim()}%`;
        whereConditions[Op.or] = [
          { numeroProcesso: { [Op.iLike]: textoLike } },
          { autor: { [Op.iLike]: textoLike } },
          { reu: { [Op.iLike]: textoLike } },
          { advogado: { [Op.iLike]: textoLike } },
          { conteudoCompleto: { [Op.iLike]: textoLike } },
        ];
      }

      const { count, rows: publicacoes } = await Publicacao.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limite),
        offset: parseInt(offset),
        order: [["dataCriacao", "DESC"]],
      });

      const totalPages = Math.ceil(count / limite);

      const response = {
        success: true,
        publicacoes: publicacoes || [],
        pagination: {
          total: count || 0,
          totalPages: totalPages || 0,
          currentPage: parseInt(pagina),
          limit: parseInt(limite),
        },
        timestamp: new Date().toISOString(),
        status: status,
        filtrosAplicados: {
          textoPesquisa: textoPesquisa || null,
          dataInicio: dataInicio
            ? dataInicio.toISOString().split("T")[0]
            : null,
          dataFim: dataFim ? dataFim.toISOString().split("T")[0] : null,
        },
      };

      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("Erro ao buscar publicações por status:", error);

      const pagina = req.query.pagina || req.query.page || 1;
      const limite = req.query.limite || req.query.limit || 50;

      const errorResponse = {
        success: false,
        error: "Erro ao buscar publicações por status",
        publicacoes: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: parseInt(pagina),
          limit: parseInt(limite),
        },
        timestamp: new Date().toISOString(),
        status: req.params.status,
      };

      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      return res.status(500).json(errorResponse);
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const statusesValidos = ["nova", "lida", "enviada", "processada"];
      if (!statusesValidos.includes(status)) {
        return res.status(400).json({
          error: `Status inválido. Valores aceitos: ${statusesValidos.join(
            ", "
          )}`,
        });
      }

      const publicacao = await Publicacao.findByPk(id);

      if (!publicacao) {
        return res.status(404).json({ error: "Publicação não encontrada" });
      }

      await publicacao.update({
        status,
        dataAtualizacao: new Date(),
        usuarioAtualizacao: req.user
          ? req.user.nome || req.user.email
          : "Sistema",
      });

      return res.status(200).json({
        message: "Status da publicação atualizado com sucesso",
        publicacao,
      });
    } catch (error) {
      console.error("Erro ao atualizar status da publicação:", error);
      return res
        .status(400)
        .json({ error: "Erro ao atualizar status da publicação." });
    }
  },

  async findByDateRange(req, res) {
    try {
      const { inicio, fim } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const dataInicio = new Date(inicio);
      const dataFim = new Date(fim);

      if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
        return res
          .status(400)
          .json({ error: "Formato de data inválido. Use YYYY-MM-DD" });
      }

      dataFim.setHours(23, 59, 59, 999);

      const offset = (page - 1) * limit;

      const { count, rows: publicacoes } = await Publicacao.findAndCountAll({
        where: {
          dataDisponibilizacao: {
            [Op.between]: [dataInicio, dataFim],
          },
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["dataDisponibilizacao", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);

      return res.status(200).json({
        publicacoes,
        pagination: {
          total: count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Erro ao buscar publicações por data:", error);
      return res
        .status(400)
        .json({ error: "Erro ao buscar publicações por data." });
    }
  },

  async findByProcesso(req, res) {
    try {
      const { numero } = req.params;

      const publicacoes = await Publicacao.findAll({
        where: {
          numeroProcesso: {
            [Op.iLike]: `%${numero}%`,
          },
        },
        order: [["dataCriacao", "DESC"]],
      });

      return res.status(200).json({ publicacoes });
    } catch (error) {
      console.error("Erro ao buscar publicações por processo:", error);
      return res
        .status(400)
        .json({ error: "Erro ao buscar publicações por processo." });
    }
  },

  async getEstatisticas(req, res) {
    try {
      const totalPorStatus = await Publicacao.findAll({
        attributes: [
          "status",
          [db.sequelize.fn("COUNT", db.sequelize.col("id")), "total"],
        ],
        group: ["status"],
      });

      const totalGeral = await Publicacao.count();

      const data30DiasAtras = new Date();
      data30DiasAtras.setDate(data30DiasAtras.getDate() - 30);

      const ultimosMes = await Publicacao.count({
        where: {
          dataCriacao: {
            [Op.gte]: data30DiasAtras,
          },
        },
      });

      return res.status(200).json({
        totalGeral,
        totalPorStatus,
        ultimosMes,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return res.status(400).json({ error: "Erro ao buscar estatísticas." });
    }
  },
};
