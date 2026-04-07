const ReadingStats = require('../models/ReadingStats');
const { successResponse, errorResponse } = require('../utils/response');

class StatsController {
  /**
   * GET /api/stats/me — Dashboard thống kê cá nhân
   */
  async getMyStats(req, res) {
    try {
      const userId = req.user.id;

      // Chạy song song tất cả queries để tối ưu tốc độ
      const [overview, favoriteGenres, activity, streak, achievements] = await Promise.all([
        ReadingStats.getOverview(userId),
        ReadingStats.getFavoriteGenres(userId),
        ReadingStats.getReadingActivity(userId, 7),
        ReadingStats.getReadingStreak(userId),
        ReadingStats.getAchievements(userId)
      ]);

      return successResponse(res, {
        overview,
        favoriteGenres,
        activity,
        streak,
        achievements
      });
    } catch (error) {
      console.error('Error fetching reading stats:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  /**
   * GET /api/stats/recommendations — Gợi ý truyện thông minh
   */
  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 12;
      
      const recommendations = await ReadingStats.getRecommendations(userId, limit);
      return successResponse(res, recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new StatsController();
