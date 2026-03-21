const Country = require('../models/Country');
const { successResponse, errorResponse } = require('../utils/response');

class CountryController {
  async getAll(req, res) {
    try {
      const countries = await Country.findAll();
      return successResponse(res, countries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new CountryController();

