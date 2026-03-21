const db = require('../config/database');

class Favorite {
  static async findByUserId(userId) {
    const [favorites] = await db.promise.query(
      `SELECT c.*, f.created_at as favorited_at 
       FROM favorites f
       JOIN comics c ON f.comic_id = c.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return favorites;
  }

  static async checkFavorite(userId, comicId) {
    const [results] = await db.promise.query(
      'SELECT id FROM favorites WHERE user_id = ? AND comic_id = ?',
      [userId, comicId]
    );
    return results.length > 0;
  }

  static async add(userId, comicId) {
    try {
      const [result] = await db.promise.query(
        'INSERT INTO favorites (user_id, comic_id) VALUES (?, ?)',
        [userId, comicId]
      );
      
      // Tăng số lượt theo dõi
      await db.promise.query(
        'UPDATE comics SET follows = follows + 1 WHERE id = ?',
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
      'DELETE FROM favorites WHERE user_id = ? AND comic_id = ?',
      [userId, comicId]
    );
    
    // Giảm số lượt theo dõi
    await db.promise.query(
      'UPDATE comics SET follows = GREATEST(follows - 1, 0) WHERE id = ?',
      [comicId]
    );
    
    return result.affectedRows > 0;
  }

  static async getCountByUserId(userId) {
    const [result] = await db.promise.query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );
    return result[0].count || 0;
  }

  static async findUsersByComicId(comicId) {
    const [users] = await db.promise.query(
      `SELECT u.id, u.username, u.email, u.email_verified
       FROM favorites f
       JOIN users u ON f.user_id = u.id
       WHERE f.comic_id = ? AND u.email_verified = TRUE`,
      [comicId]
    );
    return users;
  }
}

module.exports = Favorite;

