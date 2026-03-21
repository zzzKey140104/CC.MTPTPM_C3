const ReadingHistory = require('../models/ReadingHistory');
const { successResponse, errorResponse } = require('../utils/response');

class HistoryController {
  async getByUser(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50 } = req.query;
      const history = await ReadingHistory.findByUserId(userId, parseInt(limit));
      return successResponse(res, history);
    } catch (error) {
      console.error('Error fetching reading history:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async add(req, res) {
    try {
      const userId = req.user.id;
      const { comicId, chapterId } = req.body;

      if (!comicId || !chapterId) {
        return errorResponse(res, 'Thiếu comicId hoặc chapterId', 400);
      }

      await ReadingHistory.addOrUpdate(userId, comicId, chapterId);
      return successResponse(res, null, 'Đã cập nhật lịch sử đọc');
    } catch (error) {
      console.error('Error adding reading history:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getByComic(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      const history = await ReadingHistory.findByUserAndComic(userId, comicId);
      return successResponse(res, history);
    } catch (error) {
      console.error('Error fetching reading history by comic:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      
      if (!comicId) {
        return errorResponse(res, 'Thiếu comicId', 400);
      }

      await ReadingHistory.deleteByUserAndComic(userId, comicId);
      return successResponse(res, null, 'Đã xóa lịch sử đọc');
    } catch (error) {
      console.error('Error deleting reading history:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async deleteAll(req, res) {
    try {
      const userId = req.user.id;
      await ReadingHistory.deleteAllByUser(userId);
      return successResponse(res, null, 'Đã xóa toàn bộ lịch sử đọc');
    } catch (error) {
      console.error('Error deleting all reading history:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new HistoryController();

