const db = require('../config/database');

class ReadingHistory {
  static async findByUserId(userId, limit = 50) {
    const [history] = await db.promise.query(
      `SELECT DISTINCT c.*, rh.last_read_at, rh.chapter_id,
              (SELECT chapter_number FROM chapters WHERE id = rh.chapter_id) as last_chapter_number
       FROM reading_history rh
       JOIN comics c ON rh.comic_id = c.id
       WHERE rh.user_id = ?
       ORDER BY rh.last_read_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return history;
  }

  static async findByUserAndComic(userId, comicId) {
    const [history] = await db.promise.query(
      `SELECT rh.*, ch.chapter_number, ch.title as chapter_title
       FROM reading_history rh
       JOIN chapters ch ON rh.chapter_id = ch.id
       WHERE rh.user_id = ? AND rh.comic_id = ?
       ORDER BY rh.last_read_at DESC
       LIMIT 1`,
      [userId, comicId]
    );
    return history[0] || null;
  }

  static async addOrUpdate(userId, comicId, chapterId) {
    // Kiểm tra xem đã có lịch sử chưa
    const [existing] = await db.promise.query(
      'SELECT id FROM reading_history WHERE user_id = ? AND comic_id = ?',
      [userId, comicId]
    );

    if (existing.length > 0) {
      // Cập nhật
      await db.promise.query(
        'UPDATE reading_history SET chapter_id = ?, last_read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND comic_id = ?',
        [chapterId, userId, comicId]
      );
    } else {
      // Thêm mới
      await db.promise.query(
        'INSERT INTO reading_history (user_id, comic_id, chapter_id) VALUES (?, ?, ?)',
        [userId, comicId, chapterId]
      );
    }
  }

  static async deleteByUserAndComic(userId, comicId) {
    await db.promise.query(
      'DELETE FROM reading_history WHERE user_id = ? AND comic_id = ?',
      [userId, comicId]
    );
  }

  static async deleteAllByUser(userId) {
    await db.promise.query(
      'DELETE FROM reading_history WHERE user_id = ?',
      [userId]
    );
  }
}

module.exports = ReadingHistory;

