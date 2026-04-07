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
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
  timezone: '+07:00',
  idleTimeout: 60000,
  maxIdle: 10
});

const promisePool = pool.promise();

module.exports = pool;
module.exports.promise = promisePool;

