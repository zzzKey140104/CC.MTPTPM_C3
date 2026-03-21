const db = require('../config/database');

class Comment {
  static async findByComicId(comicId, params = {}) {
    const { page = 1, limit = 5, sort = 'popular' } = params;
    const offset = (page - 1) * limit;

    let orderBy = 'c.likes_count DESC, c.created_at DESC'; // Default: popular first
    if (sort === 'newest') {
      orderBy = 'c.created_at DESC';
    } else if (sort === 'oldest') {
      orderBy = 'c.created_at ASC';
    }

    const [comments] = await db.promise.query(
      `SELECT c.*, 
              u.username, 
              u.avatar,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
              (SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = c.id) as replies_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.comic_id = ? AND c.parent_id IS NULL
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [comicId, limit, offset]
    );

    // Load replies cho mỗi comment
    for (let comment of comments) {
      const [replies] = await db.promise.query(
        `SELECT c.*, 
                u.username, 
                u.avatar,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = ?
         ORDER BY c.created_at ASC
         LIMIT 10`,
        [comment.id]
      );
      comment.replies = replies;
    }

    return comments;
  }

  static async findByChapterId(chapterId, params = {}) {
    const { page = 1, limit = 5, sort = 'popular' } = params;
    const offset = (page - 1) * limit;

    let orderBy = 'c.likes_count DESC, c.created_at DESC';
    if (sort === 'newest') {
      orderBy = 'c.created_at DESC';
    } else if (sort === 'oldest') {
      orderBy = 'c.created_at ASC';
    }

    const [comments] = await db.promise.query(
      `SELECT c.*, 
              u.username, 
              u.avatar,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
              (SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = c.id) as replies_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.chapter_id = ? AND c.parent_id IS NULL
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [chapterId, limit, offset]
    );

    // Load replies cho mỗi comment
    for (let comment of comments) {
      const [replies] = await db.promise.query(
        `SELECT c.*, 
                u.username, 
                u.avatar,
                (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = ?
         ORDER BY c.created_at ASC
         LIMIT 10`,
        [comment.id]
      );
      comment.replies = replies;
    }

    return comments;
  }

  static async countByComicId(comicId) {
    const [result] = await db.promise.query(
      'SELECT COUNT(*) as total FROM comments WHERE comic_id = ? AND parent_id IS NULL',
      [comicId]
    );
    return result[0].total;
  }

  static async countByChapterId(chapterId) {
    const [result] = await db.promise.query(
      'SELECT COUNT(*) as total FROM comments WHERE chapter_id = ? AND parent_id IS NULL',
      [chapterId]
    );
    return result[0].total;
  }

  static async create(data) {
    const { user_id, comic_id, chapter_id, parent_id, content } = data;
    const [result] = await db.promise.query(
      'INSERT INTO comments (user_id, comic_id, chapter_id, parent_id, content) VALUES (?, ?, ?, ?, ?)',
      [user_id, comic_id || null, chapter_id || null, parent_id || null, content]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [comments] = await db.promise.query(
      `SELECT c.*, u.username, u.avatar,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    return comments[0] || null;
  }

  static async toggleLike(userId, commentId) {
    // Kiểm tra xem đã like chưa
    const [existing] = await db.promise.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    );

    if (existing.length > 0) {
      // Bỏ like
      await db.promise.query(
        'DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?',
        [userId, commentId]
      );
      await db.promise.query(
        'UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?',
        [commentId]
      );
      return { liked: false };
    } else {
      // Thêm like
      await db.promise.query(
        'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
        [userId, commentId]
      );
      await db.promise.query(
        'UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?',
        [commentId]
      );
      return { liked: true };
    }
  }

  static async checkLike(userId, commentId) {
    const [results] = await db.promise.query(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    );
    return results.length > 0;
  }

  static async delete(id, userId) {
    // Chỉ cho phép xóa comment của chính mình
    const [result] = await db.promise.query(
      'DELETE FROM comments WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Comment;

