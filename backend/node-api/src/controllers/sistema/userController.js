const db = require("../../models");
const Usuario = db.Usuario;
const fs = require("fs");
const path = require("path");

module.exports = {
  async findAll(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: { exclude: ["senha"] },
        order: [["nome", "ASC"]],
      });

      const usuariosFormatados = usuarios.map((usuario) => {
        const usuarioData = usuario.toJSON();
        usuarioData.active = usuario.ativo;
        return usuarioData;
      });

      return res.status(200).json(usuariosFormatados);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return res.status(400).json({ error: "Erro ao buscar usuários." });
    }
  },

  async findOne(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        attributes: { exclude: ["senha"] },
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const usuarioData = usuario.toJSON();
      usuarioData.active = usuario.ativo;

      return res.status(200).json(usuarioData);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return res.status(400).json({ error: "Erro ao buscar usuário." });
    }
  },

  async create(req, res) {
    const { nome, email, senha, perfil, active } = req.body;

    try {
      if (!nome || !email || !senha) {
        return res
          .status(400)
          .json({ error: "Nome, e-mail e senha são obrigatórios." });
      }

      const usuarioExiste = await Usuario.findOne({ where: { email } });
      if (usuarioExiste) {
        return res.status(400).json({ error: "E-mail já cadastrado." });
      }

      let usuarioNome = "Sistema";
      if (req.usuarioAuditoria && req.usuarioAuditoria.nome) {
        usuarioNome = req.usuarioAuditoria.nome;
      } else if (req.user && req.user.nome) {
        usuarioNome = req.user.nome;
      } else if (req.user && req.user.email) {
        usuarioNome = req.user.email;
      }

      let foto = null;
      if (req.file) {
        const uploadDir = path.join(__dirname, "../../../uploads/users");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extensao = path.extname(req.file.originalname);
        const nomeArquivo = `${nome
          .toLowerCase()
          .replace(/\s+/g, "_")}${extensao}`;

        const novoCaminho = path.join(uploadDir, nomeArquivo);
        const relativePath = `/uploads/users/${nomeArquivo}`;

        try {
          fs.renameSync(req.file.path, novoCaminho);
          foto = relativePath;
        } catch (fileError) {
          console.error(`Erro ao renomear arquivo: ${fileError.message}`);
          const originalFileName = path.basename(req.file.path);
          foto = `/uploads/users/${originalFileName}`;
        }
      }

      const isActive = active !== false && active !== "false";

      const usuario = await Usuario.create({
        nome,
        email,
        senha,
        perfil: perfil || "usuario",
        ativo: isActive,
        foto,
        usuarioCriacao: usuarioNome,
        usuarioAtualizacao: usuarioNome,
      });

      const usuarioData = usuario.toJSON();
      usuarioData.active = usuario.ativo;
      delete usuarioData.senha;

      return res.status(201).json({ usuario: usuarioData });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: "Erro ao criar usuário." });
    }
  },

  async update(req, res) {
    const { id } = req.params;
    const { nome, email, senha, perfil, active, removeFoto } = req.body;

    try {
      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const usuarioNome = req.usuarioAuditoria
        ? req.usuarioAuditoria.nome
        : "Sistema";

      let foto = usuario.foto;

      if (removeFoto === "true" && usuario.foto) {
        try {
          const fullPath = path.join(__dirname, "../../..", usuario.foto);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
          foto = null;
        } catch (fileError) {
          console.error(`Erro ao remover foto: ${fileError.message}`);
        }
      } else if (req.file) {
        if (usuario.foto) {
          try {
            const fullPath = path.join(__dirname, "../../..", usuario.foto);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } catch (fileError) {
            console.error(
              `Erro ao remover foto anterior: ${fileError.message}`
            );
          }
        }

        const uploadDir = path.join(__dirname, "../../../uploads/users");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const extensao = path.extname(req.file.originalname);
        let baseNome = `${nome.toLowerCase().replace(/\s+/g, "_")}`;
        let nomeArquivo = `${baseNome}${extensao}`;
        let novoCaminho = path.join(uploadDir, nomeArquivo);

        if (fs.existsSync(novoCaminho)) {
          nomeArquivo = `${baseNome}_${Date.now()}${extensao}`;
          novoCaminho = path.join(uploadDir, nomeArquivo);
        }
        const relativePath = `/uploads/users/${nomeArquivo}`;

        try {
          fs.renameSync(req.file.path, novoCaminho);
          foto = relativePath;
        } catch (fileError) {
          console.error(`Erro ao renomear arquivo: ${fileError.message}`);
          const originalFileName = path.basename(req.file.path);
          foto = `/uploads/users/${originalFileName}`;
        }
      }

      const isActive = active !== false && active !== "false";

      const updateData = {
        nome,
        email,
        perfil,
        ativo: isActive,
        foto,
        usuarioAtualizacao: usuarioNome,
      };

      if (senha) {
        updateData.senha = senha;
      }

      await usuario.update(updateData);

      const usuarioData = usuario.toJSON();
      usuarioData.active = usuario.ativo;
      delete usuarioData.senha;

      return res.json({ usuario: usuarioData });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      return res.status(400).json({ error: "Erro ao atualizar usuário." });
    }
  },

  async delete(req, res) {
    const { id } = req.params;
    try {
      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      if (usuario.foto) {
        try {
          const fullPath = path.join(__dirname, "../../..", usuario.foto);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (fileError) {
          console.error(`Erro ao remover foto: ${fileError.message}`);
        }
      }

      await usuario.destroy();
      return res
        .status(200)
        .json({ id, message: "Usuário excluído com sucesso!" });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: "Erro ao excluir usuário." });
    }
  },
};
