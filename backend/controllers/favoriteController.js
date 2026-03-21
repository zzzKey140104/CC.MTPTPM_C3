const Favorite = require('../models/Favorite');
const { successResponse, errorResponse } = require('../utils/response');

class FavoriteController {
  async getByUser(req, res) {
    try {
      const userId = req.user.id;
      const favorites = await Favorite.findByUserId(userId);
      return successResponse(res, favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async toggle(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.body;

      if (!comicId) {
        return errorResponse(res, 'Thiếu comicId', 400);
      }

      const isFavorite = await Favorite.checkFavorite(userId, comicId);
      
      if (isFavorite) {
        await Favorite.remove(userId, comicId);
        return successResponse(res, { isFavorite: false }, 'Đã bỏ theo dõi');
      } else {
        await Favorite.add(userId, comicId);
        return successResponse(res, { isFavorite: true }, 'Đã thêm vào theo dõi');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async check(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      const isFavorite = await Favorite.checkFavorite(userId, comicId);
      return successResponse(res, { isFavorite });
    } catch (error) {
      console.error('Error checking favorite:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await Favorite.getCountByUserId(userId);
      return successResponse(res, { count });
    } catch (error) {
      console.error('Error getting favorite count:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new FavoriteController();

