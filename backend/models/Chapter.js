const db = require('../config/database');

class Chapter {
  static async syncChapterPages(chapterId, images = []) {
    const pages = Array.isArray(images) ? images.filter(Boolean) : [];
    await db.promise.query('DELETE FROM chapter_pages WHERE chapter_id = ?', [chapterId]);
    for (let i = 0; i < pages.length; i += 1) {
      await db.promise.query(
        'INSERT INTO chapter_pages (chapter_id, page_number, image_url) VALUES (?, ?, ?)',
        [chapterId, i + 1, pages[i]]
      );
    }
  }

  static async findById(id) {
    const [chapters] = await db.promise.query(
      'SELECT * FROM chapters WHERE id = ?',
      [id]
    );
    const chapter = chapters[0] || null;
    
    // Parse images JSON nếu có
    if (chapter) {
      // Ưu tiên dữ liệu chuẩn hoá từ chapter_pages nếu có
      const [pageRows] = await db.promise.query(
        'SELECT image_url FROM chapter_pages WHERE chapter_id = ? ORDER BY page_number ASC',
        [chapter.id]
      );
      if (pageRows.length > 0) {
        chapter.images = pageRows.map((row) => row.image_url);
      } else if (chapter.images) {
        try {
          // MySQL JSON type có thể trả về object/array trực tiếp hoặc string
          if (typeof chapter.images === 'string') {
            chapter.images = JSON.parse(chapter.images);
          }
          // Đảm bảo images là array
          if (!Array.isArray(chapter.images)) {
            console.warn(`Chapter ${chapter.id} images is not an array:`, typeof chapter.images, chapter.images);
            chapter.images = [];
          }
        } catch (e) {
          console.error('Error parsing images:', e, 'Raw:', chapter.images);
          chapter.images = [];
        }
      } else {
        chapter.images = [];
      }
      
    }
    
    return chapter;
  }

  static async findByComicId(comicId, includeClosed = false, isVip = false) {
    let query = 'SELECT id, chapter_number, title, views, status, created_at FROM chapters WHERE comic_id = ?';
    if (!includeClosed) {
      // Nếu không phải admin, chỉ hiển thị chương mở hoặc vip (nếu user là vip)
      if (isVip) {
        query += ' AND (status = "open" OR status = "vip")';
      } else {
        query += ' AND status = "open"';
      }
    }
    query += ' ORDER BY chapter_number ASC';
    const [chapters] = await db.promise.query(query, [comicId]);
    return chapters;
  }

  static async findPrevChapter(comicId, chapterNumber, includeClosed = false, isVip = false) {
    let query = 'SELECT id, chapter_number FROM chapters WHERE comic_id = ? AND chapter_number < ?';
    if (!includeClosed) {
      if (isVip) {
        query += ' AND (status = "open" OR status = "vip")';
      } else {
        query += ' AND status = "open"';
      }
    }
    query += ' ORDER BY chapter_number DESC LIMIT 1';
    const [chapters] = await db.promise.query(query, [comicId, chapterNumber]);
    return chapters[0] || null;
  }

  static async findNextChapter(comicId, chapterNumber, includeClosed = false, isVip = false) {
    let query = 'SELECT id, chapter_number FROM chapters WHERE comic_id = ? AND chapter_number > ?';
    if (!includeClosed) {
      if (isVip) {
        query += ' AND (status = "open" OR status = "vip")';
      } else {
        query += ' AND status = "open"';
      }
    }
    query += ' ORDER BY chapter_number ASC LIMIT 1';
    const [chapters] = await db.promise.query(query, [comicId, chapterNumber]);
    return chapters[0] || null;
  }

  // Lấy danh sách chương đóng và vip (cho admin)
  static async findClosedAndVipChapters(comicId) {
    const [chapters] = await db.promise.query(
      'SELECT id, chapter_number, title, views, status, created_at FROM chapters WHERE comic_id = ? AND (status = "closed" OR status = "vip") ORDER BY chapter_number ASC',
      [comicId]
    );
    return chapters;
  }

  // Lấy tất cả chương VIP và đóng từ tất cả truyện (cho admin)
  static async findAllVipAndClosedChapters() {
    const [chapters] = await db.promise.query(
      `SELECT ch.id, ch.comic_id, ch.chapter_number, ch.title, ch.views, ch.status, ch.created_at,
              c.title as comic_title, c.cover_image
       FROM chapters ch
       JOIN comics c ON ch.comic_id = c.id
       WHERE ch.status = 'vip' OR ch.status = 'closed'
       ORDER BY c.title ASC, ch.chapter_number ASC`
    );
    return chapters;
  }

  static async incrementViews(id) {
    await db.promise.query(
      'UPDATE chapters SET views = views + 1 WHERE id = ?',
      [id]
    );
  }

  static async create(data) {
    const { comic_id, chapter_number, title, content, images, status = 'open' } = data;
    
    // images có thể đã là string (JSON) hoặc array
    let imagesValue = images;
    if (Array.isArray(images)) {
      imagesValue = JSON.stringify(images);
    } else if (typeof images === 'string') {
      // Đã là JSON string, giữ nguyên
      imagesValue = images;
    } else {
      imagesValue = JSON.stringify([]);
    }
    
    const [result] = await db.promise.query(
      'INSERT INTO chapters (comic_id, chapter_number, title, content, images, status) VALUES (?, ?, ?, ?, ?, ?)',
      [comic_id, chapter_number, title, content, imagesValue, status]
    );
    await this.syncChapterPages(result.insertId, Array.isArray(images) ? images : []);
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        if (key === 'images') {
          fields.push(`${key} = ?`);
          // images có thể đã là string (JSON) hoặc array
          if (Array.isArray(data[key])) {
            values.push(JSON.stringify(data[key]));
          } else if (typeof data[key] === 'string') {
            values.push(data[key]);
          } else {
            values.push(JSON.stringify([]));
          }
        } else {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.promise.query(
      `UPDATE chapters SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    if (data.images !== undefined) {
      let normalizedImages = [];
      if (Array.isArray(data.images)) {
        normalizedImages = data.images;
      } else if (typeof data.images === 'string') {
        try {
          const parsed = JSON.parse(data.images || '[]');
          normalizedImages = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          normalizedImages = [];
        }
      }
      await this.syncChapterPages(id, normalizedImages);
    }
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.promise.query(
      'DELETE FROM chapters WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Chapter;

