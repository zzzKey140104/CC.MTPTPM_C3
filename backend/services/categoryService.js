const Category = require('../models/Category');
const { createServiceError } = require('./serviceError');

class CategoryService {
  async getAll() {
    return Category.findAll();
  }

  async getById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw createServiceError('Không tìm thấy thể loại', 404);
    }
    return category;
  }
}

module.exports = new CategoryService();
