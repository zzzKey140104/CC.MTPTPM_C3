const { successResponse, errorResponse } = require('../utils/response');
const categoryService = require('../services/categoryService');

class CategoryController {
  async getAll(req, res) {
    try {
      const categories = await categoryService.getAll();
      return successResponse(res, categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const category = await categoryService.getById(id);
      return successResponse(res, category);
    } catch (error) {
      console.error('Error fetching category:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new CategoryController();

