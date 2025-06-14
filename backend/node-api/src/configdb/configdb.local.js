module.exports = {
  HOST: "localhost",
  //PORT: "8404",
  USER: "postgres",
  PASSWORD: "admin",
  DB: "db_juscash",
  dialect: "postgres",
  pool: {
    max: 100,
    min: 0,
    acquire: 15000,
    idle: 5000,
  },
};
