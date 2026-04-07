const { successResponse, errorResponse } = require('../utils/response');
const aiService = require('../services/aiService');

class AIController {
  /**
   * Tóm tắt truyện dựa vào tên, tác giả và đất nước
   */
  async summarizeComic(req, res) {
    try {
      const data = await aiService.summarizeComic({
        comicId: req.params.comicId,
        user: req.user
      });
      return successResponse(res, data, 'Tóm tắt truyện thành công');
    } catch (error) {
      console.error('Error summarizing comic:', error);
      return errorResponse(res, error.message || 'Lỗi khi tạo tóm tắt truyện', error.statusCode || 500);
    }
  }

  /**
   * Tóm tắt chương dựa vào tên truyện, tác giả, đất nước và hình ảnh
   */
  async summarizeChapter(req, res) {
    try {
      const data = await aiService.summarizeChapter({
        chapterId: req.params.chapterId,
        user: req.user
      });
      return successResponse(res, data, 'Tóm tắt chương thành công');
    } catch (error) {
      console.error('Error summarizing chapter:', error);
      return errorResponse(res, error.message || 'Lỗi khi tạo tóm tắt chương', error.statusCode || 500);
    }
  }

  /**
   * Chat với AI về truyện
   */
  async chat(req, res) {
    try {
      const data = await aiService.chat({ ...req.body, user: req.user });
      return successResponse(res, data, 'Chat thành công');
    } catch (error) {
      console.error('Error in AI chat:', error);
      return errorResponse(res, error.message || 'Lỗi khi chat với AI', error.statusCode || 500);
    }
  }

  async getChatHistory(req, res) {
    try {
      const data = await aiService.getChatHistory({
        user: req.user,
        comicId: req.query.comicId,
        chapterId: req.query.chapterId,
        limit: req.query.limit
      });
      return successResponse(res, data, 'Lấy lịch sử chat thành công');
    } catch (error) {
      console.error('Error getting AI chat history:', error);
      return errorResponse(res, error.message || 'Lỗi khi lấy lịch sử chat AI', error.statusCode || 500);
    }
  }

  async clearChatHistory(req, res) {
    try {
      const data = await aiService.clearChatHistory({
        user: req.user,
        comicId: req.body.comicId || req.query.comicId,
        chapterId: req.body.chapterId || req.query.chapterId
      });
      return successResponse(res, data, 'Xóa lịch sử chat thành công');
    } catch (error) {
      console.error('Error clearing AI chat history:', error);
      return errorResponse(res, error.message || 'Lỗi khi xóa lịch sử chat AI', error.statusCode || 500);
    }
  }

  async getDailyUsage(req, res) {
    try {
      const data = await aiService.getDailyUsage({
        user: req.user,
        from: req.query.from,
        to: req.query.to
      });
      return successResponse(res, data, 'Lấy thống kê AI theo ngày thành công');
    } catch (error) {
      console.error('Error getting AI daily usage:', error);
      return errorResponse(res, error.message || 'Lỗi khi lấy thống kê AI', error.statusCode || 500);
    }
  }

  async getUsageSummary(req, res) {
    try {
      const data = await aiService.getUsageSummary({
        user: req.user
      });
      return successResponse(res, data, 'Lấy tổng quan thống kê AI thành công');
    } catch (error) {
      console.error('Error getting AI usage summary:', error);
      return errorResponse(res, error.message || 'Lỗi khi lấy tổng quan AI', error.statusCode || 500);
    }
  }
}

module.exports = new AIController();

