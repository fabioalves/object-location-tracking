/* config.js */
require('dotenv').config();

module.exports = {
  azureSql: {
    server: process.env.DB_SERVER || 'your-server.database.windows.net',
    port: process.env.DB_PORT || 1433,
    database: process.env.DB_NAME || 'object-tracking-db',
    user: process.env.DB_USER || 'dbadmin',
    password: process.env.DB_PASSWORD || 'securePassword123',
    options: {
      encrypt: true, // Required for Azure SQL
      trustServerCertificate: false, // For security in production
      enableArithAbort: true
    }
  }
};