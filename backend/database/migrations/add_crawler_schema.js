const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error('Thiếu DB_HOST, DB_USER, DB_NAME trong .env');
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS crawl_sources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        base_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS crawl_jobs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        source_id INT NOT NULL,
        target_url VARCHAR(1000) NOT NULL,
        status ENUM('queued','running','success','failed') NOT NULL DEFAULT 'queued',
        message TEXT NULL,
        started_at TIMESTAMP NULL DEFAULT NULL,
        finished_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_crawl_jobs_source
          FOREIGN KEY (source_id) REFERENCES crawl_sources(id) ON DELETE CASCADE,
        INDEX idx_crawl_jobs_status_created (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS chapter_pages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        chapter_id INT NOT NULL,
        page_number INT NOT NULL,
        image_url VARCHAR(1000) NOT NULL,
        source_url VARCHAR(1000) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_chapter_pages_chapter
          FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
        UNIQUE KEY uq_chapter_page (chapter_id, page_number),
        INDEX idx_chapter_pages_chapter (chapter_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [comicColumns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'comics'`,
      [process.env.DB_NAME]
    );
    const comicColumnSet = new Set(comicColumns.map((c) => c.COLUMN_NAME));
    const comicAlterParts = [];
    if (!comicColumnSet.has('source_site')) comicAlterParts.push('ADD COLUMN source_site VARCHAR(100) NULL');
    if (!comicColumnSet.has('source_url')) comicAlterParts.push('ADD COLUMN source_url VARCHAR(1000) NULL');
    if (!comicColumnSet.has('source_comic_id')) comicAlterParts.push('ADD COLUMN source_comic_id VARCHAR(255) NULL');
    if (!comicColumnSet.has('raw_meta')) comicAlterParts.push('ADD COLUMN raw_meta JSON NULL');
    if (!comicColumnSet.has('crawl_status')) comicAlterParts.push(`ADD COLUMN crawl_status ENUM('new','synced','failed') NOT NULL DEFAULT 'new'`);
    if (comicAlterParts.length > 0) {
      await connection.query(`ALTER TABLE comics ${comicAlterParts.join(', ')}`);
    }

    const [chapterColumns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'chapters'`,
      [process.env.DB_NAME]
    );
    const chapterColumnSet = new Set(chapterColumns.map((c) => c.COLUMN_NAME));
    const chapterAlterParts = [];
    if (!chapterColumnSet.has('source_url')) chapterAlterParts.push('ADD COLUMN source_url VARCHAR(1000) NULL');
    if (!chapterColumnSet.has('source_chapter_id')) chapterAlterParts.push('ADD COLUMN source_chapter_id VARCHAR(255) NULL');
    if (chapterAlterParts.length > 0) {
      await connection.query(`ALTER TABLE chapters ${chapterAlterParts.join(', ')}`);
    }

    const [comicIndexes] = await connection.query(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'comics'`,
      [process.env.DB_NAME]
    );
    const comicIndexSet = new Set(comicIndexes.map((i) => i.INDEX_NAME));
    if (!comicIndexSet.has('uq_comics_source_url')) {
      await connection.query(`ALTER TABLE comics ADD UNIQUE KEY uq_comics_source_url (source_url(255))`);
    }
    if (!comicIndexSet.has('idx_comics_source_site')) {
      await connection.query(`ALTER TABLE comics ADD INDEX idx_comics_source_site (source_site)`);
    }
    if (!comicIndexSet.has('idx_comics_crawl_status')) {
      await connection.query(`ALTER TABLE comics ADD INDEX idx_comics_crawl_status (crawl_status)`);
    }

    const [chapterIndexes] = await connection.query(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'chapters'`,
      [process.env.DB_NAME]
    );
    const chapterIndexSet = new Set(chapterIndexes.map((i) => i.INDEX_NAME));
    if (!chapterIndexSet.has('uq_chapters_source_url')) {
      await connection.query(`ALTER TABLE chapters ADD UNIQUE KEY uq_chapters_source_url (source_url(255))`);
    }

    await connection.query(
      `INSERT INTO crawl_sources (name, base_url)
       VALUES ('pops', 'https://pops.vn')
       ON DUPLICATE KEY UPDATE base_url = VALUES(base_url)`
    );

    await connection.commit();
    console.log('✅ Đã nâng cấp schema crawler thành công');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Lỗi migration crawler schema:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
