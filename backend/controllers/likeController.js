const { successResponse, errorResponse } = require('../utils/response');
const likeService = require('../services/likeService');

class LikeController {
  async toggle(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.body;

      const result = await likeService.toggle(userId, comicId);
      return successResponse(res, { isLiked: result.isLiked }, result.message);
    } catch (error) {
      console.error('Error toggling like:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async check(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      const result = await likeService.check(userId, comicId);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error checking like:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new LikeController();

