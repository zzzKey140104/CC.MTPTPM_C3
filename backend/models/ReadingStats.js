const db = require('../config/database');

class ReadingStats {
  /**
   * Lấy thống kê tổng quan của user
   */
  static async getOverview(userId) {
    const [result] = await db.promise.query(
      `SELECT 
        (SELECT COUNT(DISTINCT comic_id) FROM reading_history WHERE user_id = ?) as total_comics_read,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as total_favorites,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as total_comments,
        (SELECT COUNT(*) FROM comment_likes WHERE user_id = ?) as total_likes_given`,
      [userId, userId, userId, userId]
    );
    return result[0];
  }

  /**
   * Lấy thể loại yêu thích (dựa trên lịch sử đọc + favorites)
   */
  static async getFavoriteGenres(userId) {
    const [genres] = await db.promise.query(
      `SELECT cat.id, cat.name, cat.slug, COUNT(*) as read_count
       FROM (
         SELECT DISTINCT comic_id FROM reading_history WHERE user_id = ?
         UNION
         SELECT comic_id FROM favorites WHERE user_id = ?
       ) user_comics
       JOIN comic_categories cc ON cc.comic_id = user_comics.comic_id
       JOIN categories cat ON cat.id = cc.category_id
       GROUP BY cat.id, cat.name, cat.slug
       ORDER BY read_count DESC
       LIMIT 10`,
      [userId, userId]
    );
    return genres;
  }

  /**
   * Lấy lịch sử đọc theo ngày (7 ngày gần nhất)
   */
  static async getReadingActivity(userId, days = 7) {
    const [activity] = await db.promise.query(
      `SELECT 
         DATE(last_read_at) as read_date,
         COUNT(DISTINCT comic_id) as comics_count
       FROM reading_history 
       WHERE user_id = ? AND last_read_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(last_read_at)
       ORDER BY read_date ASC`,
      [userId, days]
    );
    return activity;
  }

  /**
   * Tính reading streak (số ngày đọc liên tục)
   */
  static async getReadingStreak(userId) {
    const [dates] = await db.promise.query(
      `SELECT DISTINCT DATE(last_read_at) as read_date
       FROM reading_history
       WHERE user_id = ?
       ORDER BY read_date DESC
       LIMIT 365`,
      [userId]
    );

    if (dates.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Kiểm tra hôm nay hoặc hôm qua có đọc không
    const lastDate = new Date(dates[0].read_date);
    lastDate.setHours(0, 0, 0, 0);
    const diffFromToday = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffFromToday > 1) {
      // Streak đã bị gián đoạn
      currentStreak = 0;
    } else {
      currentStreak = 1;
    }

    // Tính streak
    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i].read_date);
      const prev = new Date(dates[i - 1].read_date);
      curr.setHours(0, 0, 0, 0);
      prev.setHours(0, 0, 0, 0);
      const diff = Math.floor((prev - curr) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        tempStreak++;
        if (i <= currentStreak || currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        if (currentStreak > 0 && i === currentStreak) {
          // Current streak ends here
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    currentStreak = Math.min(currentStreak, longestStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Gợi ý truyện thông minh dựa trên thể loại yêu thích
   */
  static async getRecommendations(userId, limit = 12) {
    // Lấy thể loại yêu thích của user
    const favoriteGenres = await this.getFavoriteGenres(userId);
    
    if (favoriteGenres.length === 0) {
      // Nếu chưa có dữ liệu, gợi ý truyện phổ biến
      const [popular] = await db.promise.query(
        `SELECT c.*, co.name as country_name,
                COALESCE(cv.total_views, 0) as views
         FROM comics c
         LEFT JOIN countries co ON c.country_id = co.id
         LEFT JOIN (
           SELECT comic_id, SUM(views) as total_views 
           FROM chapters GROUP BY comic_id
         ) cv ON cv.comic_id = c.id
         WHERE c.source_site = 'pops' AND c.access_status = 'open'
         ORDER BY views DESC
         LIMIT ?`,
        [limit]
      );
      return { comics: popular, reason: 'popular' };
    }

    // Lấy top 3 thể loại yêu thích
    const topGenreIds = favoriteGenres.slice(0, 3).map(g => g.id);
    const placeholders = topGenreIds.map(() => '?').join(',');

    // Lấy các comic_ids mà user đã đọc hoặc yêu thích (để loại trừ)
    const [readComics] = await db.promise.query(
      `SELECT DISTINCT comic_id FROM (
         SELECT comic_id FROM reading_history WHERE user_id = ?
         UNION
         SELECT comic_id FROM favorites WHERE user_id = ?
       ) already_read`,
      [userId, userId]
    );
    const readIds = readComics.map(r => r.comic_id);

    let excludeClause = '';
    let excludeParams = [];
    if (readIds.length > 0) {
      excludeClause = ` AND c.id NOT IN (${readIds.map(() => '?').join(',')})`;
      excludeParams = readIds;
    }

    // Tìm truyện cùng thể loại mà user chưa đọc
    const [recommendations] = await db.promise.query(
      `SELECT c.*, co.name as country_name,
              COALESCE(cv.total_views, 0) as views,
              COUNT(DISTINCT cc.category_id) as genre_match_count
       FROM comics c
       LEFT JOIN countries co ON c.country_id = co.id
       LEFT JOIN (
         SELECT comic_id, SUM(views) as total_views 
         FROM chapters GROUP BY comic_id
       ) cv ON cv.comic_id = c.id
       JOIN comic_categories cc ON cc.comic_id = c.id
       WHERE cc.category_id IN (${placeholders})
         AND c.source_site = 'pops' 
         AND c.access_status = 'open'
         ${excludeClause}
       GROUP BY c.id
       ORDER BY genre_match_count DESC, views DESC
       LIMIT ?`,
      [...topGenreIds, ...excludeParams, limit]
    );

    return {
      comics: recommendations,
      reason: 'genre_based',
      based_on: favoriteGenres.slice(0, 3).map(g => g.name)
    };
  }

  /**
   * Lấy thành tựu (achievements) của user
   */
  static async getAchievements(userId) {
    const overview = await this.getOverview(userId);
    const streak = await this.getReadingStreak(userId);

    const achievements = [];
    const comicsRead = overview.total_comics_read;
    const favs = overview.total_favorites;
    const comments = overview.total_comments;

    // Thành tựu đọc truyện
    if (comicsRead >= 1) achievements.push({ id: 'first_read', icon: '📖', name: 'Khởi đầu', desc: 'Đọc truyện đầu tiên', unlocked: true });
    if (comicsRead >= 5) achievements.push({ id: 'bookworm', icon: '🐛', name: 'Mọt sách', desc: 'Đọc 5 truyện', unlocked: true });
    if (comicsRead >= 10) achievements.push({ id: 'reader', icon: '📚', name: 'Độc giả', desc: 'Đọc 10 truyện', unlocked: true });
    if (comicsRead >= 25) achievements.push({ id: 'expert', icon: '🎓', name: 'Chuyên gia', desc: 'Đọc 25 truyện', unlocked: true });
    if (comicsRead >= 50) achievements.push({ id: 'master', icon: '👑', name: 'Bậc thầy', desc: 'Đọc 50 truyện', unlocked: true });
    if (comicsRead >= 100) achievements.push({ id: 'legend', icon: '🏆', name: 'Huyền thoại', desc: 'Đọc 100 truyện', unlocked: true });

    // Thành tựu streak
    if (streak.current >= 3) achievements.push({ id: 'streak3', icon: '🔥', name: 'Nóng bỏng', desc: 'Đọc 3 ngày liên tục', unlocked: true });
    if (streak.current >= 7) achievements.push({ id: 'streak7', icon: '⚡', name: 'Không ngừng nghỉ', desc: 'Đọc 7 ngày liên tục', unlocked: true });
    if (streak.longest >= 30) achievements.push({ id: 'streak30', icon: '💎', name: 'Siêu phàm', desc: 'Đạt streak 30 ngày', unlocked: true });

    // Thành tựu yêu thích
    if (favs >= 1) achievements.push({ id: 'first_fav', icon: '❤️', name: 'Yêu thích', desc: 'Theo dõi truyện đầu tiên', unlocked: true });
    if (favs >= 10) achievements.push({ id: 'collector', icon: '💖', name: 'Sưu tập gia', desc: 'Theo dõi 10 truyện', unlocked: true });

    // Thành tựu bình luận
    if (comments >= 1) achievements.push({ id: 'first_comment', icon: '💬', name: 'Lên tiếng', desc: 'Bình luận đầu tiên', unlocked: true });
    if (comments >= 10) achievements.push({ id: 'social', icon: '🗣️', name: 'Hoạt bát', desc: '10 bình luận', unlocked: true });

    // Thêm các thành tựu chưa mở (locked)
    const unlockedIds = new Set(achievements.map(a => a.id));
    const allAchievements = [
      { id: 'first_read', icon: '📖', name: 'Khởi đầu', desc: 'Đọc truyện đầu tiên', unlocked: false },
      { id: 'bookworm', icon: '🐛', name: 'Mọt sách', desc: 'Đọc 5 truyện', unlocked: false },
      { id: 'reader', icon: '📚', name: 'Độc giả', desc: 'Đọc 10 truyện', unlocked: false },
      { id: 'expert', icon: '🎓', name: 'Chuyên gia', desc: 'Đọc 25 truyện', unlocked: false },
      { id: 'master', icon: '👑', name: 'Bậc thầy', desc: 'Đọc 50 truyện', unlocked: false },
      { id: 'legend', icon: '🏆', name: 'Huyền thoại', desc: 'Đọc 100 truyện', unlocked: false },
      { id: 'streak3', icon: '🔥', name: 'Nóng bỏng', desc: 'Đọc 3 ngày liên tục', unlocked: false },
      { id: 'streak7', icon: '⚡', name: 'Không ngừng nghỉ', desc: 'Đọc 7 ngày liên tục', unlocked: false },
      { id: 'streak30', icon: '💎', name: 'Siêu phàm', desc: 'Đạt streak 30 ngày', unlocked: false },
      { id: 'first_fav', icon: '❤️', name: 'Yêu thích', desc: 'Theo dõi truyện đầu tiên', unlocked: false },
      { id: 'collector', icon: '💖', name: 'Sưu tập gia', desc: 'Theo dõi 10 truyện', unlocked: false },
      { id: 'first_comment', icon: '💬', name: 'Lên tiếng', desc: 'Bình luận đầu tiên', unlocked: false },
      { id: 'social', icon: '🗣️', name: 'Hoạt bát', desc: '10 bình luận', unlocked: false },
    ];

    // Merge: unlocked trước, locked sau
    const merged = allAchievements.map(a => ({
      ...a,
      unlocked: unlockedIds.has(a.id)
    }));

    return merged;
  }
}

module.exports = ReadingStats;
