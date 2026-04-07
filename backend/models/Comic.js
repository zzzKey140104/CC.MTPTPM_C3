const db = require('../config/database');

class Comic {
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

    let query = `SELECT c.*, co.name as country_name,
                        (SELECT COALESCE(SUM(ch.views), 0) FROM chapters ch WHERE ch.comic_id = c.id) as calculated_views,
                        (SELECT COUNT(*) FROM favorites f WHERE f.comic_id = c.id) as favorite_count,
                        (SELECT MAX(ch.updated_at) FROM chapters ch WHERE ch.comic_id = c.id) as latest_chapter_update
                 FROM comics c 
                 LEFT JOIN countries co ON c.country_id = co.id 
                 WHERE 1=1`;
    let queryParams = [];

    // Lọc theo access_status: chỉ hiển thị truyện mở hoặc vip (nếu user là vip), admin thấy tất cả
    if (!isAdmin) {
      if (isVip) {
        query += ' AND (c.access_status = "open" OR c.access_status = "vip")';
      } else {
        query += ' AND c.access_status = "open"';
      }
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.author LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Xử lý sort parameter trước khi xử lý status filter
    // Nếu sort = 'full', luôn filter completed và bỏ qua status filter từ user
    if (sort === 'full' || sort === 'completed') {
      query += ' AND c.status = ?';
      queryParams.push('completed');
    } else if (status) {
      // Chỉ áp dụng status filter nếu không phải sort = 'full'
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
        // Truyện phải có TẤT CẢ các thể loại được chọn (AND logic)
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
    let orderBy = 'c.updated_at DESC'; // Default
    switch (sort) {
      case 'views_day':
      case 'views_week':
      case 'views_month':
        // Sử dụng tổng views từ chapters (vì không có tracking views theo thời gian)
        orderBy = 'calculated_views DESC';
        break;
      case 'favorites':
        orderBy = 'favorite_count DESC';
        break;
      case 'latest_update':
        // Truyện mới cập nhật - sắp xếp theo thời gian cập nhật chương mới nhất
        orderBy = 'latest_chapter_update DESC, c.updated_at DESC';
        break;
      case 'new_comic':
        // Truyện mới thêm vào hệ thống - sắp xếp theo thời gian tạo truyện
        orderBy = 'c.created_at DESC';
        break;
      case 'full':
      case 'completed':
        // Truyện đã hoàn thành - sắp xếp theo views
        orderBy = 'calculated_views DESC';
        break;
      default:
        orderBy = 'c.updated_at DESC';
    }

    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [comics] = await db.promise.query(query, queryParams);
    // Thay thế views bằng calculated_views và thêm favorite_count
    comics.forEach(comic => {
      if (comic.calculated_views !== undefined) {
        comic.views = comic.calculated_views;
      }
      if (comic.favorite_count !== undefined) {
        comic.favorites = comic.favorite_count;
      }
    });
    return comics;
  }

  static async count(params = {}) {
    const { search = '', status = '', country_id = '', isAdmin = false, isVip = false } = params;
    let query = 'SELECT COUNT(*) as total FROM comics c WHERE 1=1';
    let params_array = [];

    // Lọc theo access_status: chỉ hiển thị truyện mở hoặc vip (nếu user là vip), admin thấy tất cả
    if (!isAdmin) {
      if (isVip) {
        query += ' AND (c.access_status = "open" OR c.access_status = "vip")';
      } else {
        query += ' AND c.access_status = "open"';
      }
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.author LIKE ?)';
      params_array.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND c.status = ?';
      params_array.push(status);
    }

    if (country_id) {
      query += ' AND c.country_id = ?';
      params_array.push(country_id);
    }

    const [result] = await db.promise.query(query, params_array);
    return result[0].total;
  }

  static async findByCategory(categoryId, params = {}) {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const [comics] = await db.promise.query(
      `SELECT DISTINCT c.*, co.name as country_name,
              (SELECT COALESCE(SUM(ch.views), 0) FROM chapters ch WHERE ch.comic_id = c.id) as calculated_views
       FROM comics c
       LEFT JOIN countries co ON c.country_id = co.id
       JOIN comic_categories cc ON c.id = cc.comic_id
       WHERE cc.category_id = ?
       ORDER BY c.updated_at DESC
       LIMIT ? OFFSET ?`,
      [categoryId, limit, offset]
    );
    // Thay thế views bằng calculated_views
    comics.forEach(comic => {
      if (comic.calculated_views !== undefined) {
        comic.views = comic.calculated_views;
      }
    });
    return comics;
  }

  static async countByCategory(categoryId) {
    const [result] = await db.promise.query(
      'SELECT COUNT(DISTINCT c.id) as total FROM comics c JOIN comic_categories cc ON c.id = cc.comic_id WHERE cc.category_id = ?',
      [categoryId]
    );
    return result[0].total;
  }

  static async findById(id, isVip = false, isAdmin = false) {
    let query = `SELECT c.*, co.name as country_name,
              (SELECT COALESCE(SUM(ch.views), 0) FROM chapters ch WHERE ch.comic_id = c.id) as calculated_views
       FROM comics c 
       LEFT JOIN countries co ON c.country_id = co.id
       WHERE c.id = ?`;
    
    // Kiểm tra quyền truy cập
    if (!isAdmin) {
      if (isVip) {
        query += ' AND (c.access_status = "open" OR c.access_status = "vip")';
      } else {
        query += ' AND c.access_status = "open"';
      }
    }
    
    const [comics] = await db.promise.query(query, [id]);
    const comic = comics[0] || null;
    if (comic && comic.calculated_views !== undefined) {
      // Sử dụng tổng lượt xem từ các chương
      comic.views = comic.calculated_views;
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

    // Đảm bảo views là tổng từ các chương
    if (comic.calculated_views !== undefined) {
      comic.views = comic.calculated_views;
    }

    return comic;
  }

  static async findPopular(limit = 6) {
    const [comics] = await db.promise.query(
      `SELECT c.*, co.name as country_name,
              (SELECT COALESCE(SUM(ch.views), 0) FROM chapters ch WHERE ch.comic_id = c.id) as calculated_views
       FROM comics c 
       LEFT JOIN countries co ON c.country_id = co.id 
       ORDER BY calculated_views DESC 
       LIMIT ?`,
      [limit]
    );
    // Thay thế views bằng calculated_views
    comics.forEach(comic => {
      if (comic.calculated_views !== undefined) {
        comic.views = comic.calculated_views;
      }
    });
    return comics;
  }

  static async findLatest(limit = 18) {
    const [comics] = await db.promise.query(
      `SELECT c.*, co.name as country_name,
              (SELECT COALESCE(SUM(ch.views), 0) FROM chapters ch WHERE ch.comic_id = c.id) as calculated_views
       FROM comics c 
       LEFT JOIN countries co ON c.country_id = co.id 
       ORDER BY c.updated_at DESC 
       LIMIT ?`,
      [limit]
    );
    // Thay thế views bằng calculated_views
    comics.forEach(comic => {
      if (comic.calculated_views !== undefined) {
        comic.views = comic.calculated_views;
      }
    });
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

  // Tính tổng lượt xem truyện từ tổng lượt xem các chương
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

  // Lấy tổng lượt xem từ các chương (không cập nhật database)
  static async getTotalViewsFromChapters(comicId) {
    const [result] = await db.promise.query(
      'SELECT COALESCE(SUM(views), 0) as total_views FROM chapters WHERE comic_id = ?',
      [comicId]
    );
    return result[0]?.total_views || 0;
  }

  // Lấy danh sách truyện đóng và VIP (cho admin)
  static async findClosedAndVipComics(params = {}) {
    const { search = '' } = params;
    
    let query = `SELECT c.*, co.name as country_name,
                        (SELECT COALESCE(SUM(ch.views), 0) FROM chapters ch WHERE ch.comic_id = c.id) as calculated_views,
                        (SELECT COUNT(*) FROM favorites f WHERE f.comic_id = c.id) as favorite_count
                 FROM comics c 
                 LEFT JOIN countries co ON c.country_id = co.id 
                 WHERE (c.access_status = 'closed' OR c.access_status = 'vip')`;
    let queryParams = [];

    if (search) {
      query += ' AND (c.title LIKE ? OR c.author LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.updated_at DESC';
    
    const [comics] = await db.promise.query(query, queryParams);
    
    // Thay thế views bằng calculated_views
    comics.forEach(comic => {
      if (comic.calculated_views !== undefined) {
        comic.views = comic.calculated_views;
      }
      if (comic.favorite_count !== undefined) {
        comic.favorites = comic.favorite_count;
      }
    });
    
    return comics;
  }
}

module.exports = Comic;

