const { successResponse, errorResponse } = require('../utils/response');
const historyService = require('../services/historyService');

class HistoryController {
  async getByUser(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50 } = req.query;
      const history = await historyService.getByUser(userId, limit);
      return successResponse(res, history);
    } catch (error) {
      console.error('Error fetching reading history:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async add(req, res) {
    try {
      const userId = req.user.id;
      const { comicId, chapterId } = req.body;

      await historyService.add(userId, comicId, chapterId);
      return successResponse(res, null, 'Đã cập nhật lịch sử đọc');
    } catch (error) {
      console.error('Error adding reading history:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getByComic(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      const history = await historyService.getByComic(userId, comicId);
      return successResponse(res, history);
    } catch (error) {
      console.error('Error fetching reading history by comic:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      
      await historyService.delete(userId, comicId);
      return successResponse(res, null, 'Đã xóa lịch sử đọc');
    } catch (error) {
      console.error('Error deleting reading history:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async deleteAll(req, res) {
    try {
      const userId = req.user.id;
      await historyService.deleteAll(userId);
      return successResponse(res, null, 'Đã xóa toàn bộ lịch sử đọc');
    } catch (error) {
      console.error('Error deleting all reading history:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new HistoryController();

