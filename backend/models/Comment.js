const db = require('../config/database');

class Comment {
  /**
   * Helper: Load tất cả comments + replies bằng 2 queries thay vì N+1
   * Query 1: Lấy parent comments
   * Query 2: Lấy tất cả replies cho các parent comments đó
   */
  static async _loadCommentsWithReplies(whereClause, whereParams, params = {}) {
    const { page = 1, limit = 5, sort = 'popular' } = params;
    const offset = (page - 1) * limit;

    let orderBy = 'c.likes_count DESC, c.created_at DESC';
    if (sort === 'newest') {
      orderBy = 'c.created_at DESC';
    } else if (sort === 'oldest') {
      orderBy = 'c.created_at ASC';
    }

    // Query 1: Lấy parent comments (CHỈ 1 query)
    const [comments] = await db.promise.query(
      `SELECT c.*, 
              u.username, 
              u.avatar,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
              (SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = c.id) as replies_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE ${whereClause} AND c.parent_id IS NULL
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    if (comments.length === 0) {
      return comments;
    }

    // Query 2: Lấy TẤT CẢ replies cho tất cả parent comments (CHỈ 1 query thay vì N)
    const parentIds = comments.map(c => c.id);
    const placeholders = parentIds.map(() => '?').join(',');
    
    const [allReplies] = await db.promise.query(
      `SELECT c.*, 
              u.username, 
              u.avatar,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.parent_id IN (${placeholders})
       ORDER BY c.created_at ASC`,
      parentIds
    );

    // Group replies theo parent_id bằng Map (O(N) thay vì O(N²))
    const repliesMap = new Map();
    for (const reply of allReplies) {
      if (!repliesMap.has(reply.parent_id)) {
        repliesMap.set(reply.parent_id, []);
      }
      const replies = repliesMap.get(reply.parent_id);
      if (replies.length < 10) { // Giới hạn 10 replies mỗi comment
        replies.push(reply);
      }
    }

    // Gắn replies vào comments
    for (const comment of comments) {
      comment.replies = repliesMap.get(comment.id) || [];
    }

    return comments;
  }

  static async findByComicId(comicId, params = {}) {
    return this._loadCommentsWithReplies('c.comic_id = ?', [comicId], params);
  }

  static async findByChapterId(chapterId, params = {}) {
    return this._loadCommentsWithReplies('c.chapter_id = ?', [chapterId], params);
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
