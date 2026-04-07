const { successResponse, errorResponse } = require('../utils/response');
const chapterService = require('../services/chapterService');

class ChapterController {
  async getById(req, res) {
    try {
      const result = await chapterService.getById({ id: req.params.id, user: req.user });
      return successResponse(res, result);
    } catch (error) {
      console.error('Error fetching chapter:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getByComicId(req, res) {
    try {
      const chapters = await chapterService.getByComicId({
        comicId: req.params.comicId,
        user: req.user
      });
      return successResponse(res, chapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async incrementViews(req, res) {
    try {
      const result = await chapterService.incrementViews(req.params.id);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error incrementing views:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new ChapterController();

