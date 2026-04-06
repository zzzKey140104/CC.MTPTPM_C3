const db = require('../config/database');

class ChapterAudio {
  static async findByChapterId(chapterId) {
    const [rows] = await db.promise.query(
      'SELECT * FROM chapter_audios WHERE chapter_id = ?',
      [chapterId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { chapter_id, text_content, audio_url, duration, status, error_message } = data;
    const [result] = await db.promise.query(
      `INSERT INTO chapter_audios (chapter_id, text_content, audio_url, duration, status, error_message) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chapter_id, text_content, audio_url, duration, status || 'pending', error_message || null]
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
