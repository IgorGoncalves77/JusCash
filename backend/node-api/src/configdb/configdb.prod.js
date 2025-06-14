module.exports = {
  HOST: "172.31.7.114",
  PORT: "5432",
  USER: "postgres",
  PASSWORD: "admin",
  DB: "db_juscash",
  dialect: "postgres",
  pool: {
    max: 500,
    min: 0,
    acquire: 15000,
    idle: 5000,
  },
};
