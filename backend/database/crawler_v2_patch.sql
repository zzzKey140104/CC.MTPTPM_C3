-- ReaCom crawler v2 patch
-- Run this file after importing schema.sql/truyen_gg_db.sql

CREATE TABLE IF NOT EXISTS crawl_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  base_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crawl_jobs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  source_id INT NOT NULL,
  target_url VARCHAR(1000) NOT NULL,
  status ENUM('queued','running','success','failed') NOT NULL DEFAULT 'queued',
  message TEXT NULL,
  started_at TIMESTAMP NULL DEFAULT NULL,
  finished_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_crawl_jobs_source FOREIGN KEY (source_id) REFERENCES crawl_sources(id) ON DELETE CASCADE,
  INDEX idx_crawl_jobs_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chapter_pages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chapter_id INT NOT NULL,
  page_number INT NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  source_url VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chapter_pages_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  UNIQUE KEY uq_chapter_page (chapter_id, page_number),
  INDEX idx_chapter_pages_chapter (chapter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE comics
  ADD COLUMN source_site VARCHAR(100) NULL,
  ADD COLUMN source_url VARCHAR(1000) NULL,
  ADD COLUMN source_comic_id VARCHAR(255) NULL,
  ADD COLUMN raw_meta JSON NULL,
  ADD COLUMN crawl_status ENUM('new','synced','failed') NOT NULL DEFAULT 'new';

ALTER TABLE comics ADD UNIQUE KEY uq_comics_source_url (source_url(255));
ALTER TABLE comics ADD INDEX idx_comics_source_site (source_site);
ALTER TABLE comics ADD INDEX idx_comics_crawl_status (crawl_status);

ALTER TABLE chapters
  ADD COLUMN source_url VARCHAR(1000) NULL,
  ADD COLUMN source_chapter_id VARCHAR(255) NULL;

ALTER TABLE chapters ADD UNIQUE KEY uq_chapters_source_url (source_url(255));

INSERT INTO crawl_sources (name, base_url)
VALUES ('pops', 'https://pops.vn')
ON DUPLICATE KEY UPDATE base_url = VALUES(base_url);
