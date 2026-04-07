const mysql = require('mysql2');
require('dotenv').config();

// Validate required database environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  throw new Error('Thiếu các biến môi trường database bắt buộc: DB_HOST, DB_USER, DB_NAME');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

module.exports = pool;
module.exports.promise = promisePool;

