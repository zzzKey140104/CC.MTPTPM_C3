SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ai_usage_logs;
DROP TABLE IF EXISTS chapter_summaries;
DROP TABLE IF EXISTS story_summaries;
DROP TABLE IF EXISTS user_notification_states;
DROP TABLE IF EXISTS email_outbox;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS comment_likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS vip_subscriptions;
DROP TABLE IF EXISTS vip_plans;
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS payment_providers;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS crawl_item_story_links;
DROP TABLE IF EXISTS crawl_items;
DROP TABLE IF EXISTS crawl_jobs;
DROP TABLE IF EXISTS crawl_sources;
DROP TABLE IF EXISTS reading_history;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS chapter_pages;
DROP TABLE IF EXISTS chapter_contents;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS comic_categories;
DROP TABLE IF EXISTS story_tag_maps;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS story_aliases;
DROP TABLE IF EXISTS comics;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS user_auth_providers;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NULL,
  avatar VARCHAR(500) NULL,
  role ENUM('reader','vip','admin') NOT NULL DEFAULT 'reader',
  account_status ENUM('active','locked','banned') NOT NULL DEFAULT 'active',
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  google_id VARCHAR(255) NULL,
  email_verification_token VARCHAR(255) NULL,
  password_reset_token VARCHAR(255) NULL,
  password_reset_expires DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_id (google_id),
  KEY idx_users_role (role),
  KEY idx_users_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_key VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_key (permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_auth_providers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('google') NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_auth_provider (provider, provider_user_id),
  KEY idx_user_auth_providers_user (user_id),
  CONSTRAINT fk_user_auth_providers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE countries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_countries_name (name),
  UNIQUE KEY uq_countries_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  author VARCHAR(255) NULL,
  description TEXT NULL,
  cover_image VARCHAR(500) NULL,
  status ENUM('ongoing','completed','hiatus','dropped') NOT NULL DEFAULT 'ongoing',
  access_status ENUM('open','closed','vip') NOT NULL DEFAULT 'open',
  source_type ENUM('manual','crawl') NOT NULL DEFAULT 'manual',
  source_site VARCHAR(100) NULL,
  source_url VARCHAR(1000) NULL,
  source_comic_id VARCHAR(255) NULL,
  crawl_status ENUM('new','synced','failed') NOT NULL DEFAULT 'new',
  raw_meta JSON NULL,
  country_id INT UNSIGNED NULL,
  views BIGINT UNSIGNED NOT NULL DEFAULT 0,
  likes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  follows BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_chapters INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_comics_slug (slug),
  UNIQUE KEY uq_comics_source_url (source_url(255)),
  KEY idx_comics_status (status),
  KEY idx_comics_access_status (access_status),
  KEY idx_comics_country_id (country_id),
  KEY idx_comics_source_site (source_site),
  KEY idx_comics_crawl_status (crawl_status),
  CONSTRAINT fk_comics_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
  CONSTRAINT fk_comics_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comic_categories (
  comic_id BIGINT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comic_id, category_id),
  KEY idx_comic_categories_category (category_id),
  CONSTRAINT fk_comic_categories_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_comic_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chapters (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  comic_id BIGINT UNSIGNED NOT NULL,
  chapter_number INT UNSIGNED NOT NULL,
  title VARCHAR(255) NULL,
  content MEDIUMTEXT NULL,
  images JSON NULL,
  source_url VARCHAR(1000) NULL,
  source_chapter_id VARCHAR(255) NULL,
  views BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('open','closed','vip') NOT NULL DEFAULT 'open',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chapters_comic_number (comic_id, chapter_number),
  UNIQUE KEY uq_chapters_source_url (source_url(255)),
  KEY idx_chapters_comic_id (comic_id),
  KEY idx_chapters_status (status),
  CONSTRAINT fk_chapters_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_chapters_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chapter_pages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chapter_id BIGINT UNSIGNED NOT NULL,
  page_number INT UNSIGNED NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  source_url VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chapter_pages_chapter_page (chapter_id, page_number),
  CONSTRAINT fk_chapter_pages_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  comic_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_user_comic (user_id, comic_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  comic_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_likes_user_comic (user_id, comic_id),
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reading_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  comic_id BIGINT UNSIGNED NOT NULL,
  chapter_id BIGINT UNSIGNED NOT NULL,
  last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reading_history_user_comic (user_id, comic_id),
  CONSTRAINT fk_reading_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reading_history_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_reading_history_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE crawl_sources (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  base_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_crawl_sources_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE crawl_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_id INT UNSIGNED NOT NULL,
  target_url VARCHAR(1000) NOT NULL,
  status ENUM('queued','running','success','failed','partial') NOT NULL DEFAULT 'queued',
  message TEXT NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crawl_jobs_status_created (status, created_at),
  CONSTRAINT fk_crawl_jobs_source FOREIGN KEY (source_id) REFERENCES crawl_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE crawl_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  crawl_job_id BIGINT UNSIGNED NOT NULL,
  source_item_id VARCHAR(255) NULL,
  source_url VARCHAR(1000) NULL,
  item_type ENUM('story','chapter','asset') NOT NULL,
  payload JSON NOT NULL,
  process_status ENUM('new','mapped','ignored','failed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crawl_items_job (crawl_job_id),
  CONSTRAINT fk_crawl_items_job FOREIGN KEY (crawl_job_id) REFERENCES crawl_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE crawl_item_story_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  crawl_item_id BIGINT UNSIGNED NOT NULL,
  comic_id BIGINT UNSIGNED NOT NULL,
  chapter_id BIGINT UNSIGNED NULL,
  linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_crawl_item_story_links_item (crawl_item_id),
  CONSTRAINT fk_crawl_item_story_links_item FOREIGN KEY (crawl_item_id) REFERENCES crawl_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_crawl_item_story_links_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_crawl_item_story_links_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_providers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_key VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_providers_key (provider_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vip_plans (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  duration_days INT UNSIGNED NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vip_plans_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_id INT UNSIGNED NOT NULL,
  vip_plan_id INT UNSIGNED NULL,
  order_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','success','failed','expired','cancelled') NOT NULL DEFAULT 'pending',
  payment_type ENUM('vip_upgrade') NOT NULL DEFAULT 'vip_upgrade',
  qr_code_url TEXT NULL,
  qr_code_data TEXT NULL,
  provider_transaction_id VARCHAR(100) NULL,
  callback_payload JSON NULL,
  expires_at DATETIME NOT NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_transactions_order_id (order_id),
  KEY idx_payment_transactions_user (user_id),
  KEY idx_payment_transactions_status (status),
  CONSTRAINT fk_payment_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_transactions_provider FOREIGN KEY (provider_id) REFERENCES payment_providers(id),
  CONSTRAINT fk_payment_transactions_plan FOREIGN KEY (vip_plan_id) REFERENCES vip_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','success','failed','expired','cancelled') NOT NULL DEFAULT 'pending',
  payment_type ENUM('vip_upgrade') NOT NULL DEFAULT 'vip_upgrade',
  qr_code_url TEXT NULL,
  qr_code_data TEXT NULL,
  momo_transaction_id VARCHAR(100) NULL,
  expires_at DATETIME NOT NULL,
  payment_transaction_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order_id (order_id),
  KEY idx_payments_user (user_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_transaction FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vip_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  payment_transaction_id BIGINT UNSIGNED NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_vip_subscriptions_user_status (user_id, status),
  CONSTRAINT fk_vip_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_vip_subscriptions_payment FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  comic_id BIGINT UNSIGNED NULL,
  chapter_id BIGINT UNSIGNED NULL,
  parent_id BIGINT UNSIGNED NULL,
  content TEXT NOT NULL,
  likes_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_user (user_id),
  KEY idx_comments_comic (comic_id),
  KEY idx_comments_chapter (chapter_id),
  KEY idx_comments_parent (parent_id),
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comment_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  comment_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_comment_likes_user_comment (user_id, comment_id),
  CONSTRAINT fk_comment_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_likes_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  comic_id BIGINT UNSIGNED NULL,
  chapter_id BIGINT UNSIGNED NULL,
  type ENUM('new_chapter','comic_completed','new_comment','comment_liked','system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  chapter_number INT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read (user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE story_summaries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  comic_id BIGINT UNSIGNED NOT NULL,
  summary TEXT NOT NULL,
  model_name VARCHAR(80) NOT NULL DEFAULT 'gemini-2.5-flash',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_story_summaries_comic (comic_id),
  CONSTRAINT fk_story_summaries_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE CASCADE,
  CONSTRAINT fk_story_summaries_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chapter_summaries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chapter_id BIGINT UNSIGNED NOT NULL,
  summary TEXT NOT NULL,
  model_name VARCHAR(80) NOT NULL DEFAULT 'gemini-2.5-flash',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_chapter_summaries_chapter (chapter_id),
  CONSTRAINT fk_chapter_summaries_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  CONSTRAINT fk_chapter_summaries_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_usage_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  comic_id BIGINT UNSIGNED NULL,
  chapter_id BIGINT UNSIGNED NULL,
  action ENUM('summarize_story','summarize_chapter','chat') NOT NULL,
  prompt_chars INT UNSIGNED NOT NULL DEFAULT 0,
  response_chars INT UNSIGNED NOT NULL DEFAULT 0,
  model_name VARCHAR(80) NOT NULL DEFAULT 'gemini-2.5-flash',
  is_success TINYINT(1) NOT NULL DEFAULT 1,
  error_message VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ai_usage_logs_user (user_id),
  KEY idx_ai_usage_logs_action (action),
  CONSTRAINT fk_ai_usage_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_usage_logs_comic FOREIGN KEY (comic_id) REFERENCES comics(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_usage_logs_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (name, description) VALUES
('admin', 'Administrator'),
('reader', 'Reader role'),
('vip', 'VIP role');

INSERT INTO permissions (permission_key, description) VALUES
('users.manage', 'Manage users'),
('stories.manage', 'Manage stories'),
('crawler.run', 'Run crawler'),
('payments.manage', 'Manage payments'),
('notifications.manage', 'Manage notifications');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p WHERE r.name = 'admin';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = u.role;

INSERT INTO crawl_sources (name, base_url) VALUES ('pops', 'https://pops.vn');
INSERT INTO payment_providers (provider_key, display_name, is_active) VALUES ('momo', 'MoMo', 1);
INSERT INTO vip_plans (code, name, duration_days, price, is_active) VALUES ('VIP_30D', 'VIP 30 ngay', 30, 50000, 1);
