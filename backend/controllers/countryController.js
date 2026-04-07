const { successResponse, errorResponse } = require('../utils/response');
const countryService = require('../services/countryService');

class CountryController {
  async getAll(req, res) {
    try {
      const countries = await countryService.getAll();
      return successResponse(res, countries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new CountryController();

