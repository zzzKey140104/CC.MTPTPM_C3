const { successResponse, errorResponse } = require('../utils/response');
const commentService = require('../services/commentService');

class CommentController {
  async getByComicId(req, res) {
    try {
      const { comicId } = req.params;
      const { page = 1, limit = 5, sort = 'popular' } = req.query;
      
      const result = await commentService.getByComicId(comicId, { page, limit, sort });
      return successResponse(res, result);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getByChapterId(req, res) {
    try {
      const { chapterId } = req.params;
      const { page = 1, limit = 5, sort = 'popular' } = req.query;
      
      const result = await commentService.getByChapterId(chapterId, { page, limit, sort });
      return successResponse(res, result);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async create(req, res) {
    try {
      const userId = req.user.id;
      const comment = await commentService.create(userId, req.body);
      return successResponse(res, comment, 201);
    } catch (error) {
      console.error('Error creating comment:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async toggleLike(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await commentService.toggleLike(userId, id);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error toggling like:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async checkLike(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await commentService.checkLike(userId, id);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error checking like:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await commentService.delete(userId, id);
      return successResponse(res, { message: 'Đã xóa bình luận' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new CommentController();

