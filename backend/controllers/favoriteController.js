const { successResponse, errorResponse } = require('../utils/response');
const favoriteService = require('../services/favoriteService');

class FavoriteController {
  async getByUser(req, res) {
    try {
      const userId = req.user.id;
      const favorites = await favoriteService.getByUser(userId);
      return successResponse(res, favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async toggle(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.body;

      const result = await favoriteService.toggle(userId, comicId);
      return successResponse(res, { isFavorite: result.isFavorite }, result.message);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async check(req, res) {
    try {
      const userId = req.user.id;
      const { comicId } = req.params;
      const result = await favoriteService.check(userId, comicId);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getCount(req, res) {
    try {
      const userId = req.user.id;
      const result = await favoriteService.getCount(userId);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error getting favorite count:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new FavoriteController();

