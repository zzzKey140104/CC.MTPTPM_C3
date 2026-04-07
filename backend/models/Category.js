const db = require('../config/database');

class Category {
  static async findAll() {
    const [categories] = await db.promise.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return categories;
  }

  static async findById(id) {
    const [categories] = await db.promise.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return categories[0] || null;
  }

  static async findBySlug(slug) {
    const [categories] = await db.promise.query(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );
    return categories[0] || null;
  }
}

module.exports = Category;

