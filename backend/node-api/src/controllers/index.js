// Controllers do sistema
const auth = require("./sistema/authController");
const user = require("./sistema/userController");

// Controllers da aplicação
const publicacao = require("./aplicacao/publicacaoController");

module.exports = {
  auth,
  user,
  publicacao,
};
