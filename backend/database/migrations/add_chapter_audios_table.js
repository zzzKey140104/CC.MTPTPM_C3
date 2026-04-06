// Migration: Create chapter_audios table
// Run: node database/migrations/add_chapter_audios_table.js

const db = require('../../config/database');

async function runMigration() {
  console.log('🚀 Starting migration: Create chapter_audios table\n');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS chapter_audios (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      chapter_id BIGINT UNSIGNED NOT NULL,
      text_content LONGTEXT,
      audio_url VARCHAR(500),
      duration INT DEFAULT 0,
      status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
      error_message TEXT,
      error_code VARCHAR(64),
      provider VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- Foreign key
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      
      -- Index for faster lookups
      INDEX idx_chapter_id (chapter_id),
      INDEX idx_status (status),
      UNIQUE INDEX idx_unique_chapter (chapter_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    console.log('📋 Creating chapter_audios table...');
    await db.promise.query(createTableSQL);
    console.log('✅ Table chapter_audios created successfully!\n');

    // Safe alter for existing environments (older table definition).
    await db.promise.query('ALTER TABLE chapter_audios ADD COLUMN IF NOT EXISTS error_code VARCHAR(64) NULL');
    await db.promise.query('ALTER TABLE chapter_audios ADD COLUMN IF NOT EXISTS provider VARCHAR(64) NULL');
    console.log('✅ Ensured columns: error_code, provider\n');

    // Verify table was created
    const [tables] = await db.promise.query('SHOW TABLES LIKE "chapter_audios"');
    if (tables.length > 0) {
      console.log('✅ Verified: chapter_audios table exists\n');
    }

    // Show table structure
    const [columns] = await db.promise.query('DESCRIBE chapter_audios');
    console.log('📊 Table structure:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
    });

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

runMigration();
