// db.js
const { Pool } = require('pg');

// Use your actual DB credentials here
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'users',
  password: 'R@ngers55',
  port: 5432, // default PostgreSQL port
});

module.exports = pool;

