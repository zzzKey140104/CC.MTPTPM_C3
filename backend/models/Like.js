const db = require('../config/database');

class Like {
  static async checkLike(userId, comicId) {
    const [results] = await db.promise.query(
      'SELECT id FROM likes WHERE user_id = ? AND comic_id = ?',
      [userId, comicId]
    );
    return results.length > 0;
  }

  static async add(userId, comicId) {
    try {
      const [result] = await db.promise.query(
        'INSERT INTO likes (user_id, comic_id) VALUES (?, ?)',
        [userId, comicId]
      );
      
      // Tăng số lượt thích
      await db.promise.query(
        'UPDATE comics SET likes = likes + 1 WHERE id = ?',
        [comicId]
      );
      
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return null; // Đã tồn tại
      }
      throw error;
    }
  }

  static async remove(userId, comicId) {
    const [result] = await db.promise.query(
      'DELETE FROM likes WHERE user_id = ? AND comic_id = ?',
      [userId, comicId]
    );
    
    // Giảm số lượt thích
    await db.promise.query(
      'UPDATE comics SET likes = GREATEST(likes - 1, 0) WHERE id = ?',
      [comicId]
    );
    
    return result.affectedRows > 0;
  }
}

module.exports = Like;

