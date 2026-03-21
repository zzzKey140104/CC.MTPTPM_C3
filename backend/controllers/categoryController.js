const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');

class CategoryController {
  async getAll(req, res) {
    try {
      const categories = await Category.findAll();
      return successResponse(res, categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);
      
      if (!category) {
        return errorResponse(res, 'Không tìm thấy thể loại', 404);
      }

      return successResponse(res, category);
    } catch (error) {
      console.error('Error fetching category:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new CategoryController();

