const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error('Thiếu DB_HOST, DB_USER, DB_NAME trong .env');
  }

  const sqlPath = path.join(__dirname, '..', 'truyen_gg_db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('🔄 Reset và tạo lại schema mới...');
    await connection.query(sql);
    console.log('✅ Hoàn tất reset schema mới');
  } catch (error) {
    console.error('❌ Lỗi reset schema:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
