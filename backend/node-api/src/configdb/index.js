require("dotenv").config();
const env = process.env.NODE_ENV || "development";

const configPaths = {
  production: "./configdb.prod",
  development: "./configdb.local",
};

const dbConfig = require(configPaths[env] || configPaths.local);

module.exports = dbConfig;
