const db = require('../config/database');

class UsedAI {
  static async create(data) {
    const { user_id, comic_id = null, chapter_id = null, role, content } = data;
    const [result] = await db.promise.query(
      `INSERT INTO used_ai (user_id, comic_id, chapter_id, role, content)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, comic_id, chapter_id, role, content]
    );
    return result.insertId;
  }

  static async findByContext(userId, { comicId = null, chapterId = null, limit = 50 }) {
    const normalizedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isNaN(normalizedLimit) ? 50 : Math.max(1, Math.min(normalizedLimit, 200));

    let query = `
      SELECT id, role, content, comic_id, chapter_id, created_at
      FROM used_ai
      WHERE user_id = ?
    `;
    const values = [userId];

    if (chapterId) {
      query += ' AND chapter_id = ?';
      values.push(chapterId);
    } else if (comicId) {
      query += ' AND comic_id = ? AND chapter_id IS NULL';
      values.push(comicId);
    } else {
      query += ' AND comic_id IS NULL AND chapter_id IS NULL';
    }

    query += ' ORDER BY created_at ASC LIMIT ?';
    values.push(safeLimit);

    const [rows] = await db.promise.query(query, values);
    return rows;
  }

  static async clearByContext(userId, { comicId = null, chapterId = null }) {
    let query = 'DELETE FROM used_ai WHERE user_id = ?';
    const values = [userId];

    if (chapterId) {
      query += ' AND chapter_id = ?';
      values.push(chapterId);
    } else if (comicId) {
      query += ' AND comic_id = ? AND chapter_id IS NULL';
      values.push(comicId);
    } else {
      query += ' AND comic_id IS NULL AND chapter_id IS NULL';
    }

    const [result] = await db.promise.query(query, values);
    return result.affectedRows || 0;
  }
}

module.exports = UsedAI;
