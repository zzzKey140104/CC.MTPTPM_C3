const Country = require('../models/Country');

class CountryService {
  async getAll() {
    return Country.findAll();
  }
}

module.exports = new CountryService();
