-- Migration: Add password reset fields to users table
-- Date: 2025-12-23
-- Description: Add password_reset_token and password_reset_expires columns to users table

-- Check if columns exist before adding (to avoid errors if migration is run multiple times)
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname1 = "password_reset_token";
SET @columnname2 = "password_reset_expires";

-- Check if password_reset_token column exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname1)
  ) > 0,
  "SELECT 'Column password_reset_token already exists' AS result;",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname1, " VARCHAR(255) DEFAULT NULL;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check if password_reset_expires column exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname2)
  ) > 0,
  "SELECT 'Column password_reset_expires already exists' AS result;",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname2, " TIMESTAMP NULL DEFAULT NULL;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on password_reset_token for faster lookups
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = 'idx_password_reset_token')
  ) > 0,
  "SELECT 'Index idx_password_reset_token already exists' AS result;",
  CONCAT("CREATE INDEX idx_password_reset_token ON ", @tablename, " (", @columnname1, ");")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT 'Migration completed successfully!' AS result;

