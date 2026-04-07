const db = require('../config/database');

class Comic {
  /**
   * Helper: Xây dựng WHERE clause chung cho access_status filtering
   */
  static _buildAccessFilter(isAdmin, isVip) {
    if (isAdmin) return '';
    if (isVip) return ' AND (c.access_status = "open" OR c.access_status = "vip")';
    return ' AND c.access_status = "open"';
  }

  static async findAll(params = {}) {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      country_id = '', 
      sort = '',
      includeCategories = '',
      excludeCategories = '',
      isVip = false,
      isAdmin = false
    } = params;
    const offset = (page - 1) * limit;

    // Dùng LEFT JOIN aggregates thay vì correlated subqueries
    // Trước: 3 subqueries chạy cho MỖI row → O(N * 3)
    // Sau: 1 JOIN pre-aggregated → O(1)
    let query = `SELECT c.*, co.name as country_name,
                        COALESCE(cv.total_views, 0) as calculated_views,
                        COALESCE(fc.fav_count, 0) as favorite_count,
                        cv.latest_update as latest_chapter_update
                 FROM comics c 
                 LEFT JOIN countries co ON c.country_id = co.id
                 LEFT JOIN (
                   SELECT comic_id, 
                          SUM(views) as total_views, 
                          MAX(updated_at) as latest_update 
                   FROM chapters 
                   GROUP BY comic_id
                 ) cv ON cv.comic_id = c.id
                 LEFT JOIN (
                   SELECT comic_id, COUNT(*) as fav_count 
                   FROM favorites 
                   GROUP BY comic_id
                 ) fc ON fc.comic_id = c.id
                 WHERE 1=1 AND c.source_site = 'pops'`;
    let queryParams = [];

    // Access status filter
    query += this._buildAccessFilter(isAdmin, isVip);

    if (search) {
      query += ' AND (c.title LIKE ? OR c.author LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Xử lý sort parameter trước khi xử lý status filter
    if (sort === 'full' || sort === 'completed') {
      query += ' AND c.status = ?';
      queryParams.push('completed');
    } else if (status) {
      query += ' AND c.status = ?';
      queryParams.push(status);
    }

    if (country_id) {
      query += ' AND c.country_id = ?';
      queryParams.push(country_id);
    }

    // Xử lý category filtering
    if (includeCategories) {
      const includeIds = includeCategories.split(',').filter(id => id);
      if (includeIds.length > 0) {
        query += ` AND c.id IN (
          SELECT comic_id 
          FROM comic_categories 
          WHERE category_id IN (${includeIds.map(() => '?').join(',')})
          GROUP BY comic_id
          HAVING COUNT(DISTINCT category_id) = ?
        )`;
        queryParams.push(...includeIds, includeIds.length);
      }
    }

    if (excludeCategories) {
      const excludeIds = excludeCategories.split(',').filter(id => id);
      if (excludeIds.length > 0) {
        query += ` AND c.id NOT IN (
          SELECT DISTINCT comic_id 
          FROM comic_categories 
          WHERE category_id IN (${excludeIds.map(() => '?').join(',')})
        )`;
        queryParams.push(...excludeIds);
      }
    }

    // Xử lý sort parameter cho ORDER BY
    let orderBy = 'c.updated_at DESC';
    switch (sort) {
      case 'views_day':
      case 'views_week':
      case 'views_month':
        orderBy = 'calculated_views DESC';
        break;
      case 'favorites':
        orderBy = 'favorite_count DESC';
        break;
      case 'latest_update':
        orderBy = 'latest_chapter_update DESC, c.updated_at DESC';
        break;
      case 'new_comic':
        orderBy = 'c.created_at DESC';
        break;
      case 'full':
      case 'completed':
        orderBy = 'calculated_views DESC';
        break;
      default:
        orderBy = 'c.updated_at DESC';
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [comics] = await db.promise.query(query, queryParams);
    // Map calculated fields
    for (const comic of comics) {
      comic.views = comic.calculated_views || 0;
      comic.favorites = comic.favorite_count || 0;
    }
    return comics;
  }

  static async count(params = {}) {
    const { search = '', status = '', country_id = '', sort = '', includeCategories = '', excludeCategories = '', isAdmin = false, isVip = false } = params;
    let query = `SELECT COUNT(*) as total FROM comics c WHERE 1=1 AND c.source_site = 'pops'`;
    let queryParams = [];

    query += this._buildAccessFilter(isAdmin, isVip);

    if (search) {
      query += ' AND (c.title LIKE ? OR c.author LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'full' || sort === 'completed') {
      query += ' AND c.status = ?';
      queryParams.push('completed');
    } else if (status) {
      query += ' AND c.status = ?';
      queryParams.push(status);
    }

    if (country_id) {
      query += ' AND c.country_id = ?';
      queryParams.push(country_id);
    }

    if (includeCategories) {
      const includeIds = includeCategories.split(',').filter(id => id);
      if (includeIds.length > 0) {
        query += ` AND c.id IN (
          SELECT comic_id FROM comic_categories 
          WHERE category_id IN (${includeIds.map(() => '?').join(',')})
          GROUP BY comic_id HAVING COUNT(DISTINCT category_id) = ?
        )`;
        queryParams.push(...includeIds, includeIds.length);
      }
    }

    if (excludeCategories) {
      const excludeIds = excludeCategories.split(',').filter(id => id);
      if (excludeIds.length > 0) {
        query += ` AND c.id NOT IN (
          SELECT DISTINCT comic_id FROM comic_categories 
          WHERE category_id IN (${excludeIds.map(() => '?').join(',')})
        )`;
        queryParams.push(...excludeIds);
      }
    }

    const [result] = await db.promise.query(query, queryParams);
    return result[0].total;
  }

  static async findByCategory(categoryId, params = {}) {
    const { page = 1, limit = 20, isVip = false, isAdmin = false } = params;
    const offset = (page - 1) * limit;

    let query = `SELECT DISTINCT c.*, co.name as country_name,
                        COALESCE(cv.total_views, 0) as calculated_views
                 FROM comics c
                 LEFT JOIN countries co ON c.country_id = co.id
                 LEFT JOIN (
                   SELECT comic_id, SUM(views) as total_views 
                   FROM chapters GROUP BY comic_id
                 ) cv ON cv.comic_id = c.id
                 JOIN comic_categories cc ON c.id = cc.comic_id
                 WHERE cc.category_id = ? AND c.source_site = 'pops'`;
    const queryParams = [categoryId];

    // Filter access_status ở SQL level thay vì JS level
    query += this._buildAccessFilter(isAdmin, isVip);

    query += ' ORDER BY c.updated_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [comics] = await db.promise.query(query, queryParams);
    for (const comic of comics) {
      comic.views = comic.calculated_views || 0;
    }
    return comics;
  }

  static async countByCategory(categoryId, isVip = false, isAdmin = false) {
    let query = `SELECT COUNT(DISTINCT c.id) as total
                 FROM comics c
                 JOIN comic_categories cc ON c.id = cc.comic_id
                 WHERE cc.category_id = ? AND c.source_site = 'pops'`;
    const queryParams = [categoryId];

    query += this._buildAccessFilter(isAdmin, isVip);

    const [result] = await db.promise.query(query, queryParams);
    return result[0].total;
  }

  static async findById(id, isVip = false, isAdmin = false) {
    let query = `SELECT c.*, co.name as country_name,
                        COALESCE(cv.total_views, 0) as calculated_views
                 FROM comics c 
                 LEFT JOIN countries co ON c.country_id = co.id
                 LEFT JOIN (
                   SELECT comic_id, SUM(views) as total_views 
                   FROM chapters WHERE comic_id = ?
                   GROUP BY comic_id
                 ) cv ON cv.comic_id = c.id
                 WHERE c.id = ? AND c.source_site = 'pops'`;
    const queryParams = [id, id];

    query += this._buildAccessFilter(isAdmin, isVip);
    
    const [comics] = await db.promise.query(query, queryParams);
    const comic = comics[0] || null;
    if (comic) {
      comic.views = comic.calculated_views || 0;
    }
    return comic;
  }

  static async findByIdWithCategories(id, isVip = false, isAdmin = false) {
    const comic = await this.findById(id, isVip, isAdmin);
    if (!comic) return null;

    // Lấy thể loại
    const [categories] = await db.promise.query(
      `SELECT cat.id, cat.name, cat.slug 
       FROM categories cat
       JOIN comic_categories cc ON cat.id = cc.category_id
       WHERE cc.comic_id = ?`,
      [id]
    );
    comic.categories = categories;

    // Chuẩn hoá metadata crawl
    if (comic.raw_meta) {
      try {
        const meta = typeof comic.raw_meta === 'string' ? JSON.parse(comic.raw_meta) : comic.raw_meta;
        comic.author = meta.author || comic.author || null;
        comic.artist = meta.artist || null;
        comic.rating = meta.rating || null;
        comic.content_by = meta.contentBy || null;
        if ((!comic.categories || comic.categories.length === 0) && Array.isArray(meta.genres)) {
          comic.categories = meta.genres.map((name, idx) => ({
            id: -(idx + 1),
            name,
            slug: name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          }));
        }
      } catch (e) {
        // Ignore malformed raw_meta
      }
    }

    return comic;
  }

  static async findPopular(limit = 6) {
    const [comics] = await db.promise.query(
      `SELECT c.*, co.name as country_name,
              COALESCE(cv.total_views, 0) as calculated_views
       FROM comics c 
       LEFT JOIN countries co ON c.country_id = co.id
       LEFT JOIN (
         SELECT comic_id, SUM(views) as total_views 
         FROM chapters GROUP BY comic_id
       ) cv ON cv.comic_id = c.id
       WHERE c.source_site = 'pops'
       ORDER BY calculated_views DESC 
       LIMIT ?`,
      [limit]
    );
    for (const comic of comics) {
      comic.views = comic.calculated_views || 0;
    }
    return comics;
  }

  static async findLatest(limit = 18) {
    const [comics] = await db.promise.query(
      `SELECT c.*, co.name as country_name,
              COALESCE(cv.total_views, 0) as calculated_views
       FROM comics c 
       LEFT JOIN countries co ON c.country_id = co.id
       LEFT JOIN (
         SELECT comic_id, SUM(views) as total_views 
         FROM chapters GROUP BY comic_id
       ) cv ON cv.comic_id = c.id
       WHERE c.source_site = 'pops'
       ORDER BY c.updated_at DESC 
       LIMIT ?`,
      [limit]
    );
    for (const comic of comics) {
      comic.views = comic.calculated_views || 0;
    }
    return comics;
  }

  static async create(data) {
    const { title, slug, author, description, cover_image, status, country_id, access_status } = data;
    const [result] = await db.promise.query(
      'INSERT INTO comics (title, slug, author, description, cover_image, status, country_id, access_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, slug, author, description, cover_image, status || 'ongoing', country_id || null, access_status || 'open']
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.promise.query(
      `UPDATE comics SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.promise.query(
      'DELETE FROM comics WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async incrementViews(id) {
    await db.promise.query(
      'UPDATE comics SET views = views + 1 WHERE id = ?',
      [id]
    );
  }

  static async updateViewsFromChapters(comicId) {
    const [result] = await db.promise.query(
      `UPDATE comics c 
       SET c.views = (
         SELECT COALESCE(SUM(views), 0) 
         FROM chapters 
         WHERE comic_id = ?
       )
       WHERE c.id = ?`,
      [comicId, comicId]
    );
    return result.affectedRows > 0;
  }

  static async getTotalViewsFromChapters(comicId) {
    const [result] = await db.promise.query(
      'SELECT COALESCE(SUM(views), 0) as total_views FROM chapters WHERE comic_id = ?',
      [comicId]
    );
    return result[0]?.total_views || 0;
  }

  static async findClosedAndVipComics(params = {}) {
    const { search = '' } = params;
    
    let query = `SELECT c.*, co.name as country_name,
                        COALESCE(cv.total_views, 0) as calculated_views,
                        COALESCE(fc.fav_count, 0) as favorite_count
                 FROM comics c 
                 LEFT JOIN countries co ON c.country_id = co.id
                 LEFT JOIN (
                   SELECT comic_id, SUM(views) as total_views 
                   FROM chapters GROUP BY comic_id
                 ) cv ON cv.comic_id = c.id
                 LEFT JOIN (
                   SELECT comic_id, COUNT(*) as fav_count 
                   FROM favorites GROUP BY comic_id
                 ) fc ON fc.comic_id = c.id
                 WHERE c.source_site = 'pops' AND (c.access_status = 'closed' OR c.access_status = 'vip')`;
    let queryParams = [];

    if (search) {
      query += ' AND (c.title LIKE ? OR c.author LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.updated_at DESC';
    
    const [comics] = await db.promise.query(query, queryParams);
    for (const comic of comics) {
      comic.views = comic.calculated_views || 0;
      comic.favorites = comic.favorite_count || 0;
    }
    return comics;
  }
}

module.exports = Comic;
