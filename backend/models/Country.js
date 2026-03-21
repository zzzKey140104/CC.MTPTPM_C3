const db = require('../config/database');

class Country {
  static async findAll() {
    const [countries] = await db.promise.query(
      'SELECT * FROM countries ORDER BY name ASC'
    );
    return countries;
  }

  static async findById(id) {
    const [countries] = await db.promise.query(
      'SELECT * FROM countries WHERE id = ?',
      [id]
    );
    return countries[0] || null;
  }

  static async findBySlug(slug) {
    const [countries] = await db.promise.query(
      'SELECT * FROM countries WHERE slug = ?',
      [slug]
    );
    return countries[0] || null;
  }
}

module.exports = Country;

