const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const { createServiceError } = require('./serviceError');

class ComicService {
  async getAll({ query, user }) {
    const { page = 1, limit = 20, search = '' } = query;
    const isAdmin = user && user.role === 'admin';
    const isVip = user && (user.role === 'vip' || user.role === 'admin');
    const params = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      isVip,
      isAdmin
    };

    const comics = await Comic.findAll(params);
    const total = await Comic.count(params);
    return {
      data: comics,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }

  async getById({ id, user }) {
    const isAdmin = user && user.role === 'admin';
    const isVip = user && (user.role === 'vip' || user.role === 'admin');

    const comic = await Comic.findByIdWithCategories(id, isVip, isAdmin);
    if (!comic) {
      throw createServiceError('Không tìm thấy truyện', 404);
    }

    if (comic.access_status === 'closed' && !isAdmin) {
      throw createServiceError('Truyện này đã bị đóng và không thể xem', 403);
    }
    if (comic.access_status === 'vip' && !isVip) {
      throw createServiceError('Truyện này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.', 403);
    }

    const chapters = await Chapter.findByComicId(id, isAdmin, isVip);
    return { ...comic, chapters };
  }

  async incrementViews(id) {
    await Comic.incrementViews(id);
    return { message: 'Đã tăng lượt xem' };
  }

  async getByCategory({ categoryId, query, user }) {
    const { page = 1, limit = 20 } = query;
    const isAdmin = user && user.role === 'admin';
    const isVip = user && (user.role === 'vip' || user.role === 'admin');
    const comics = await Comic.findByCategory(categoryId, { page: parseInt(page, 10), limit: parseInt(limit, 10) });
    const filteredComics = comics.filter((comic) => {
      if (isAdmin) return true;
      if (comic.access_status === 'open') return true;
      if (comic.access_status === 'vip' && isVip) return true;
      return false;
    });
    const total = await Comic.countByCategory(categoryId);

    return {
      data: filteredComics,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  async getAllWithFilters({ query, user }) {
    const {
      page = 1,
      limit = 30,
      search = '',
      status = '',
      country_id = '',
      sort = '',
      includeCategories = '',
      excludeCategories = ''
    } = query;
    const isAdmin = user && user.role === 'admin';
    const isVip = user && (user.role === 'vip' || user.role === 'admin');
    const params = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
      country_id,
      sort,
      includeCategories,
      excludeCategories,
      isVip,
      isAdmin
    };

    const comics = await Comic.findAll(params);
    const total = await Comic.count(params);
    return {
      data: comics,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }

  async getLatest(limit) {
    return Comic.findLatest(parseInt(limit, 10) || 10);
  }

  async getPopular(limit) {
    return Comic.findPopular(parseInt(limit, 10) || 10);
  }
}

module.exports = new ComicService();
