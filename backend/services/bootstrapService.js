function validateEnv(requiredEnvVars) {
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length === 0) {
    return;
  }

  console.error('❌ Lỗi: Thiếu các biến môi trường bắt buộc:');
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Vui lòng tạo file .env trong thư mục backend với các biến môi trường cần thiết.');
  console.error('   Bạn có thể copy từ file .env.example:');
  console.error('   Windows: copy .env.example .env');
  console.error('   Linux/Mac: cp .env.example .env\n');
  process.exit(1);
}

function warnIfWeakJwtSecret(secret) {
  if (secret === 'your_secret_key_here_change_in_production') {
    console.warn('⚠️  Cảnh báo: Bạn đang sử dụng JWT_SECRET mặc định. Hãy thay đổi trong file .env để bảo mật hơn!');
  }
}

function testDatabaseConnection(db) {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Database connection error:', err);
      return;
    }

    console.log('✅ Connected to MySQL database');
    connection.release();
  });
}

async function ensureUsedAiTable(db) {
  await db.promise.query(`
    CREATE TABLE IF NOT EXISTS used_ai (
      id INT(11) NOT NULL AUTO_INCREMENT,
      user_id INT(11) NOT NULL,
      comic_id INT(11) DEFAULT NULL,
      chapter_id INT(11) DEFAULT NULL,
      role ENUM('user','assistant') NOT NULL,
      content LONGTEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_used_ai_user_context_created (user_id, comic_id, chapter_id, created_at),
      KEY idx_used_ai_comic (comic_id),
      KEY idx_used_ai_chapter (chapter_id),
      CONSTRAINT used_ai_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT used_ai_ibfk_2 FOREIGN KEY (comic_id) REFERENCES comics (id) ON DELETE SET NULL,
      CONSTRAINT used_ai_ibfk_3 FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ ensured table used_ai');
}

async function ensureUserSessionsTable(db) {
  await db.promise.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INT(11) NOT NULL AUTO_INCREMENT,
      user_id INT(11) NOT NULL,
      refresh_token_hash VARCHAR(255) NOT NULL,
      device_info VARCHAR(255) DEFAULT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      is_revoked TINYINT(1) NOT NULL DEFAULT 0,
      last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_refresh_token_hash (refresh_token_hash),
      KEY idx_user_revoked (user_id, is_revoked),
      KEY idx_session_expires_at (expires_at),
      CONSTRAINT user_sessions_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ ensured table user_sessions');
}

async function ensureAiUsageStatsDailyTable(db) {
  await db.promise.query(`
    CREATE TABLE IF NOT EXISTS ai_usage_stats_daily (
      id INT(11) NOT NULL AUTO_INCREMENT,
      user_id INT(11) NOT NULL,
      date DATE NOT NULL,
      chat_count INT(11) NOT NULL DEFAULT 0,
      summary_count INT(11) NOT NULL DEFAULT 0,
      estimated_input_tokens INT(11) NOT NULL DEFAULT 0,
      estimated_output_tokens INT(11) NOT NULL DEFAULT 0,
      estimated_cost DECIMAL(12,6) NOT NULL DEFAULT 0.000000,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY unique_user_date (user_id, date),
      KEY idx_ai_usage_date (date),
      CONSTRAINT ai_usage_stats_daily_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ ensured table ai_usage_stats_daily');
}

module.exports = {
  validateEnv,
  warnIfWeakJwtSecret,
  testDatabaseConnection,
  ensureUsedAiTable,
  ensureUserSessionsTable,
  ensureAiUsageStatsDailyTable
};
