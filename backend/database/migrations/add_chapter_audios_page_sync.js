/**
 * Thêm cột page_sync (JSON): trọng số độ dài văn bản OCR theo từng ảnh — dùng đồng bộ audio ↔ trang.
 * Chạy: node database/migrations/add_chapter_audios_page_sync.js
 */
const db = require('../../config/database');

async function run() {
  console.log('Migration: add chapter_audios.page_sync\n');
  try {
    const [cols] = await db.promise.query(
      "SHOW COLUMNS FROM chapter_audios LIKE 'page_sync'"
    );
    if (cols.length > 0) {
      console.log('Column page_sync already exists, skip.');
      process.exit(0);
      return;
    }
    await db.promise.query(
      'ALTER TABLE chapter_audios ADD COLUMN page_sync JSON NULL COMMENT \'OCR page weights for audio sync\''
    );
    console.log('OK: page_sync added.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
  process.exit(0);
}

run();
