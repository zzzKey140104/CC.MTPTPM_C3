const { successResponse, errorResponse } = require('../utils/response');
const comicService = require('../services/comicService');

class ComicController {
  async getAll(req, res) {
    try {
      const result = await comicService.getAll({ query: req.query, user: req.user });
      return successResponse(res, result);
    } catch (error) {
      console.error('Error fetching comics:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getById(req, res) {
    try {
      const result = await comicService.getById({ id: req.params.id, user: req.user });
      return successResponse(res, result);
    } catch (error) {
      console.error('Error fetching comic detail:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async incrementViews(req, res) {
    try {
      const result = await comicService.incrementViews(req.params.id);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error incrementing views:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getByCategory(req, res) {
    try {
      const result = await comicService.getByCategory({
        categoryId: req.params.categoryId,
        query: req.query,
        user: req.user
      });
      return successResponse(res, result);
    } catch (error) {
      console.error('Error fetching comics by category:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getAllWithFilters(req, res) {
    try {
      const result = await comicService.getAllWithFilters({ query: req.query, user: req.user });
      return successResponse(res, result);
    } catch (error) {
      console.error('Error fetching comics:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getLatest(req, res) {
    try {
      const comics = await comicService.getLatest(req.query.limit);
      return successResponse(res, comics);
    } catch (error) {
      console.error('Error fetching latest comics:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getPopular(req, res) {
    try {
      const comics = await comicService.getPopular(req.query.limit);
      return successResponse(res, comics);
    } catch (error) {
      console.error('Error fetching popular comics:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new ComicController();

