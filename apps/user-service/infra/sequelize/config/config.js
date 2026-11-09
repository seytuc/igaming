require('dotenv').config();

module.exports = {
  development: {
    username: process.env.USER_DB_USER,
    password: process.env.USER_DB_PASSWORD,
    database: process.env.USER_DB_NAME,
    host: process.env.USER_DB_HOST,
    port: process.env.USER_DB_PORT,
    dialect: 'postgres',
  },
};
