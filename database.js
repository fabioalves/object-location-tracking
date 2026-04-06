const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => { console.log('Connected to Azure SQL'); return pool; })
  .catch(err => console.error('DB connection failed:', err));

module.exports = { sql, poolPromise };