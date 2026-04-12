const db = require('../config/database');

class ChapterAudio {
  static async ensureTableExists() {
    const [tables] = await db.promise.query('SHOW TABLES LIKE "chapter_audios"');
    return tables.length > 0;
  }

  /** Thêm cột page_sync nếu chưa có (đồng bộ audio theo trang OCR). */
  static async ensurePageSyncColumn() {
    try {
      const ok = await this.ensureTableExists();
      if (!ok) return false;
      const [cols] = await db.promise.query(
        "SHOW COLUMNS FROM chapter_audios LIKE 'page_sync'"
      );
      if (cols.length > 0) return true;
      await db.promise.query(
        "ALTER TABLE chapter_audios ADD COLUMN page_sync JSON NULL COMMENT 'OCR page weights for audio sync'"
      );
      console.log('✅ chapter_audios.page_sync column ready');
      return true;
    } catch (e) {
      console.warn('⚠️  Could not ensure chapter_audios.page_sync:', e.message);
      return false;
    }
  }

  static async findByChapterId(chapterId) {
    const [rows] = await db.promise.query(
      'SELECT * FROM chapter_audios WHERE chapter_id = ?',
      [chapterId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const {
      chapter_id,
      text_content,
      audio_url,
      duration,
      status,
      error_message,
      error_code,
      provider,
      page_sync
    } = data;
    const [result] = await db.promise.query(
      `INSERT INTO chapter_audios (chapter_id, text_content, audio_url, duration, status, error_message, error_code, provider, page_sync)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chapter_id,
        text_content,
        audio_url,
        duration,
        status || 'pending',
        error_message || null,
        error_code || null,
        provider || null,
        page_sync != null ? page_sync : null
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.promise.query(
      `UPDATE chapter_audios SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async updateByChapterId(chapterId, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(chapterId);
    const [result] = await db.promise.query(
      `UPDATE chapter_audios SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE chapter_id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.promise.query(
      'DELETE FROM chapter_audios WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async deleteByChapterId(chapterId) {
    const [result] = await db.promise.query(
      'DELETE FROM chapter_audios WHERE chapter_id = ?',
      [chapterId]
    );
    return result.affectedRows > 0;
  }

  static async findByStatus(status, limit = 10) {
    const [rows] = await db.promise.query(
      'SELECT * FROM chapter_audios WHERE status = ? ORDER BY created_at ASC LIMIT ?',
      [status, limit]
    );
    return rows;
  }
}

module.exports = ChapterAudio;
