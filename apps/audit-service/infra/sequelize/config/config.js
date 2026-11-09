require('dotenv').config()

module.exports = {
  development: {
    username: process.env.AUDIT_DB_USER,
    password: process.env.AUDIT_DB_PASSWORD,
    database: process.env.AUDIT_DB_NAME,
    host: process.env.AUDIT_DB_HOST,
    port: process.env.AUDIT_DB_PORT,
    dialect: 'postgres',
  },
};