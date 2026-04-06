const express = require('express');
const sql = require('mssql');
require('dotenv').config();
const { poolPromise } = require('./database');

const app = express();

// Add object-location pair
app.get('/add', async (req, res) => {
  const { object, location } = req.query;
  if (!object || !location) {
    return res.status(400).send('Missing object or location');
  }

  try {
    // Using MERGE statement for upsert (INSERT or UPDATE)
    const upsertSql = `
      MERGE objects AS TARGET
      USING (SELECT @object AS object, @location AS location) AS SOURCE
      ON TARGET.object = SOURCE.object
      WHEN MATCHED THEN
        UPDATE SET TARGET.location = SOURCE.location
      WHEN NOT MATCHED BY TARGET THEN
        INSERT (object, location)
        VALUES (SOURCE.object, SOURCE.location);
    `;

    const pool = await poolPromise;
    await pool.request()
      .input('object', sql.NVarChar, object)
      .input('location', sql.NVarChar, location)
      .query(upsertSql);

    res.send('Stored successfully');
  } catch (error) {
    console.error('Database operation error:', error.message);
    res.status(500).send('Error storing data');
  }
});

// Search for object location
app.get('/search', async (req, res) => {
  const { object } = req.query;
  if (!object) {
    return res.status(400).send('Missing object parameter');
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('object', sql.NVarChar, object)
      .query('SELECT location FROM objects WHERE object = @object');

    const row = result.recordset[0];
    res.send(row ? row.location : 'Not found');
  } catch (error) {
    console.error('Database query error:', error.message);
    res.status(500).send('Error retrieving data');
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 AS isHealthy');
    res.status(200).send('Database connection is healthy');
  } catch (error) {
    res.status(503).send('Database connection failed');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    const pool = await poolPromise;
    await pool.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database:', error.message);
    process.exit(1);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});