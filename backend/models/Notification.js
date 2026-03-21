const db = require('../config/database');

class Notification {
  static async create(data) {
    const { user_id, comic_id, type, title, message, chapter_id, chapter_number } = data;
    const [result] = await db.promise.query(
      `INSERT INTO notifications (user_id, comic_id, type, title, message, chapter_id, chapter_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, comic_id || null, type, title, message, chapter_id || null, chapter_number || null]
    );
    return result.insertId;
  }

  static async findByUserId(userId, options = {}) {
    const { limit = 50, unreadOnly = false } = options;
    let query = `
      SELECT n.*, c.title as comic_title, c.slug as comic_slug, c.cover_image
      FROM notifications n
      LEFT JOIN comics c ON n.comic_id = c.id
      WHERE n.user_id = ?
    `;
    const params = [userId];

    if (unreadOnly) {
      query += ' AND n.is_read = FALSE';
    }

    query += ' ORDER BY n.created_at DESC LIMIT ?';
    params.push(limit);

    const [notifications] = await db.promise.query(query, params);
    return notifications;
  }

  static async getUnreadCount(userId) {
    const [result] = await db.promise.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result[0].count || 0;
  }

  static async markAsRead(notificationId, userId) {
    const [result] = await db.promise.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  }

  static async markAllAsRead(userId) {
    const [result] = await db.promise.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows;
  }

  static async createForAllFollowers(comicId, type, title, message, chapterId = null, chapterNumber = null) {
    // Lấy tất cả user đang theo dõi truyện này
    const [followers] = await db.promise.query(
      'SELECT user_id FROM favorites WHERE comic_id = ?',
      [comicId]
    );

    // Tạo thông báo cho từng user
    const notifications = [];
    for (const follower of followers) {
      const notificationId = await this.create({
        user_id: follower.user_id,
        comic_id: comicId,
        type,
        title,
        message,
        chapter_id: chapterId,
        chapter_number: chapterNumber
      });
      notifications.push(notificationId);
    }

    return notifications;
  }
}

module.exports = Notification;

