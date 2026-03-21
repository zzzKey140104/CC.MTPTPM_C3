const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetCloneOnlyData() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error('Thiếu DB_HOST, DB_USER, DB_NAME trong .env');
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    await conn.beginTransaction();

    // Xóa dữ liệu liên quan truyện cũ, giữ lại users/auth/payments.
    await conn.query('DELETE FROM crawl_jobs');
    await conn.query('DELETE FROM chapter_pages');
    await conn.query('DELETE FROM comic_categories');
    await conn.query('DELETE FROM chapters');
    await conn.query('DELETE FROM comments');
    await conn.query('DELETE FROM notifications');
    await conn.query('DELETE FROM favorites');
    await conn.query('DELETE FROM likes');
    await conn.query('DELETE FROM reading_history');
    await conn.query('DELETE FROM comics');

    // Reset auto increment cho các bảng chính truyện.
    await conn.query('ALTER TABLE chapters AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE chapter_pages AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE comics AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE comments AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE notifications AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE favorites AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE likes AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE reading_history AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE crawl_jobs AUTO_INCREMENT = 1');

    await conn.commit();
    console.log('✅ Đã reset dữ liệu truyện cũ. Hệ thống sẵn sàng cho clone-only.');
  } catch (error) {
    await conn.rollback();
    console.error('❌ Lỗi khi reset dữ liệu:', error);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

resetCloneOnlyData();
