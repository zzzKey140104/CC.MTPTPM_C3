const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Validate required database environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  console.error('❌ Thiếu các biến môi trường database bắt buộc: DB_HOST, DB_USER, DB_NAME');
  process.exit(1);
}

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  multipleStatements: true
});

// Simple migration: Add password reset fields
async function runMigration() {
  try {
    console.log('🔄 Bắt đầu migration: Thêm các cột password reset...');
    
    // Check if columns exist
    const [columns] = await connection.promise().query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
       AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires', 'email_verification_token')`,
      [process.env.DB_NAME]
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add email_verification_token if not exists
    if (!existingColumns.includes('email_verification_token')) {
      console.log('➕ Thêm cột email_verification_token...');
      await connection.promise().query(
        `ALTER TABLE users 
         ADD COLUMN email_verification_token VARCHAR(255) DEFAULT NULL`
      );
      console.log('✅ Đã thêm cột email_verification_token');
    } else {
      console.log('ℹ️  Cột email_verification_token đã tồn tại');
    }
    
    // Add password_reset_token if not exists
    if (!existingColumns.includes('password_reset_token')) {
      console.log('➕ Thêm cột password_reset_token...');
      await connection.promise().query(
        `ALTER TABLE users 
         ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL`
      );
      console.log('✅ Đã thêm cột password_reset_token');
    } else {
      console.log('ℹ️  Cột password_reset_token đã tồn tại');
    }

    // Add password_reset_expires if not exists
    if (!existingColumns.includes('password_reset_expires')) {
      console.log('➕ Thêm cột password_reset_expires...');
      await connection.promise().query(
        `ALTER TABLE users 
         ADD COLUMN password_reset_expires TIMESTAMP NULL DEFAULT NULL`
      );
      console.log('✅ Đã thêm cột password_reset_expires');
    } else {
      console.log('ℹ️  Cột password_reset_expires đã tồn tại');
    }

    // Add indexes if not exists
    const [indexes] = await connection.promise().query(
      `SELECT INDEX_NAME 
       FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
       AND INDEX_NAME IN ('idx_password_reset_token', 'idx_email_verification_token')`,
      [process.env.DB_NAME]
    );

    const existingIndexes = indexes.map(idx => idx.INDEX_NAME);

    if (!existingIndexes.includes('idx_password_reset_token')) {
      console.log('➕ Thêm index cho password_reset_token...');
      await connection.promise().query(
        `CREATE INDEX idx_password_reset_token ON users (password_reset_token)`
      );
      console.log('✅ Đã thêm index idx_password_reset_token');
    } else {
      console.log('ℹ️  Index idx_password_reset_token đã tồn tại');
    }

    if (!existingIndexes.includes('idx_email_verification_token')) {
      console.log('➕ Thêm index cho email_verification_token...');
      await connection.promise().query(
        `CREATE INDEX idx_email_verification_token ON users (email_verification_token)`
      );
      console.log('✅ Đã thêm index idx_email_verification_token');
    } else {
      console.log('ℹ️  Index idx_email_verification_token đã tồn tại');
    }

    console.log('✅ Migration hoàn tất thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi chạy migration:', error);
    process.exit(1);
  } finally {
    connection.end();
  }
}

runMigration();

