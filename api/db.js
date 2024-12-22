const { Pool } = require('pg');

// Use environment variable for the database connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // Required for Heroku SSL connections
  },
});

module.exports = pool;
