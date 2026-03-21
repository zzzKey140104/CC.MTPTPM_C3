const Like = require('../models/Like');
const { successResponse, errorResponse } = require('../utils/response');

class LikeController {
  async toggle(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.body;

      if (!comicId) {
        return errorResponse(res, 'Thiếu comicId', 400);
      }

      const isLiked = await Like.checkLike(userId, comicId);
      
      if (isLiked) {
        await Like.remove(userId, comicId);
        return successResponse(res, { isLiked: false }, 'Đã bỏ thích');
      } else {
        await Like.add(userId, comicId);
        return successResponse(res, { isLiked: true }, 'Đã thích');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async check(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      const isLiked = await Like.checkLike(userId, comicId);
      return successResponse(res, { isLiked });
    } catch (error) {
      console.error('Error checking like:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new LikeController();

