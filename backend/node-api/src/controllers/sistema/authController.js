const db = require("../../models");
const Usuario = db.Usuario;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

module.exports = {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res
          .status(400)
          .json({ mensagem: "Email e senha são obrigatórios" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ mensagem: "Formato de email inválido" });
      }

      const usuario = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (!usuario) {
        return res.status(401).json({
          mensagem:
            "Email não cadastrado. Verifique o email ou crie uma nova conta.",
        });
      }

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({
          mensagem: "Senha incorreta. Verifique sua senha e tente novamente.",
        });
      }

      if (!usuario.ativo) {
        return res.status(403).json({
          mensagem:
            "Sua conta está desativada. Entre em contato com o suporte.",
        });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          perfil: usuario.perfil,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      await usuario.update({
        ultimo_login: new Date(),
      });

      const usuarioData = usuario.toJSON();
      delete usuarioData.senha;

      return res.status(200).json({
        token,
        usuario: usuarioData,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      return res.status(500).json({
        mensagem:
          "Erro interno do servidor. Tente novamente em alguns minutos.",
      });
    }
  },

  async logout(req, res) {
    try {
      return res.status(200).json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Erro no logout:", error);
      return res.status(500).json({ error: "Erro no processo de logout" });
    }
  },

  async getCurrentUser(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.user.id, {
        attributes: { exclude: ["senha"] },
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.status(200).json({ usuario });
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error);
      return res.status(500).json({ error: "Erro ao obter dados do usuário" });
    }
  },

  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token não fornecido" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
      }

      const usuario = await Usuario.findByPk(decoded.id, {
        attributes: { exclude: ["senha"] },
      });

      if (!usuario || !usuario.ativo) {
        return res.status(401).json({ error: "Usuário inválido ou inativo" });
      }

      const newToken = jwt.sign(
        {
          id: usuario.id,
          perfil: usuario.perfil,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      return res.status(200).json({
        token: newToken,
        usuario: usuario,
      });
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      return res.status(500).json({ error: "Erro ao renovar token" });
    }
  },

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const usuario = await Usuario.findOne({ where: { email } });

      if (!usuario) {
        return res.status(200).json({
          message:
            "Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha",
        });
      }

      const resetToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const resetTokenHash = await bcrypt.hash(resetToken, 10);

      await usuario.update({
        token_reset_senha: resetTokenHash,
        expiracao_token_reset: new Date(Date.now() + 3600000), // 1 hora
      });

      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/reset-password?token=${resetToken}`;

      return res.status(200).json({
        message:
          "Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha",
        resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
      });
    } catch (error) {
      console.error("Erro na recuperação de senha:", error);
      return res.status(500).json({
        error: "Erro ao processar solicitação de recuperação de senha",
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, senha, confirmacaoSenha } = req.body;

      if (!token || !senha) {
        return res
          .status(400)
          .json({ error: "Token e senha são obrigatórios" });
      }

      if (senha !== confirmacaoSenha) {
        return res.status(400).json({ error: "As senhas não conferem" });
      }

      if (senha.length < 6) {
        return res
          .status(400)
          .json({ error: "A senha deve ter pelo menos 6 caracteres" });
      }

      const usuario = await Usuario.findOne({
        where: {
          token_reset_senha: { [Op.ne]: null },
          expiracao_token_reset: { [Op.gt]: new Date() },
        },
      });

      if (!usuario) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      const tokenValido = await bcrypt.compare(
        token,
        usuario.token_reset_senha
      );
      if (!tokenValido) {
        return res.status(400).json({ error: "Token inválido" });
      }

      await usuario.update({
        senha,
        token_reset_senha: null,
        expiracao_token_reset: null,
      });

      return res.status(200).json({
        message: "Senha redefinida com sucesso",
      });
    } catch (error) {
      console.error("Erro na redefinição de senha:", error);
      return res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  },

  async registro(req, res) {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res
          .status(400)
          .json({ mensagem: "Nome, email e senha são obrigatórios" });
      }

      if (nome.trim().length < 2) {
        return res
          .status(400)
          .json({ mensagem: "O nome deve ter pelo menos 2 caracteres" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ mensagem: "Formato de email inválido" });
      }

      if (senha.length < 6) {
        return res
          .status(400)
          .json({ mensagem: "A senha deve ter pelo menos 6 caracteres" });
      }

      const usuarioExiste = await Usuario.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (usuarioExiste) {
        return res.status(400).json({
          mensagem:
            "Este email já está cadastrado. Tente fazer login ou use um email diferente.",
        });
      }

      const usuario = await Usuario.create({
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha,
        perfil: "usuario",
        ativo: true,
        usuarioCriacao: "Sistema",
        usuarioAtualizacao: "Sistema",
      });

      const token = jwt.sign(
        {
          id: usuario.id,
          perfil: usuario.perfil,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      const usuarioData = usuario.toJSON();
      delete usuarioData.senha;

      return res.status(201).json({
        token,
        usuario: usuarioData,
        mensagem: "Usuário criado com sucesso",
      });
    } catch (error) {
      console.error("Erro no registro:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          mensagem:
            "Este email já está cadastrado. Tente fazer login ou use um email diferente.",
        });
      }

      if (error.name === "SequelizeValidationError") {
        const mensagens = error.errors.map((err) => err.message);
        return res.status(400).json({
          mensagem: mensagens.join(". "),
        });
      }

      return res.status(500).json({
        mensagem:
          "Erro interno do servidor. Tente novamente em alguns minutos.",
      });
    }
  },
};
