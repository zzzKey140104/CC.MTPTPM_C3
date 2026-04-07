const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');

class ComicController {
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const isAdmin = req.user && req.user.role === 'admin';
      const isVip = req.user && (req.user.role === 'vip' || req.user.role === 'admin');
      const params = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isVip,
        isAdmin
      };

      const comics = await Comic.findAll(params);
      const total = await Comic.count(params); // Sửa: truyền params thay vì chỉ search

      return successResponse(res, {
        data: comics,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit)
        }
      });
    } catch (error) {
      console.error('Error fetching comics:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const isAdmin = req.user && req.user.role === 'admin';
      const isVip = req.user && (req.user.role === 'vip' || req.user.role === 'admin');
      
      const comic = await Comic.findByIdWithCategories(id, isVip, isAdmin);
      if (!comic) {
        return errorResponse(res, 'Không tìm thấy truyện', 404);
      }

      // Kiểm tra access_status của truyện
      if (comic.access_status === 'closed' && !isAdmin) {
        return errorResponse(res, 'Truyện này đã bị đóng và không thể xem', 403);
      }
      
      if (comic.access_status === 'vip' && !isVip) {
        return errorResponse(res, 'Truyện này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.', 403);
      }

      // Không tăng lượt xem ở đây nữa, sẽ tách riêng endpoint
      // Chỉ admin mới thấy các chương đã đóng
      const chapters = await Chapter.findByComicId(id, isAdmin, isVip);

      return successResponse(res, {
        ...comic,
        chapters
      });
    } catch (error) {
      console.error('Error fetching comic detail:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async incrementViews(req, res) {
    try {
      const { id } = req.params;
      await Comic.incrementViews(id);
      return successResponse(res, { message: 'Đã tăng lượt xem' });
    } catch (error) {
      console.error('Error incrementing views:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const isAdmin = req.user && req.user.role === 'admin';
      const isVip = req.user && (req.user.role === 'vip' || req.user.role === 'admin');
      
      // Note: findByCategory doesn't support filtering yet, but we can filter in the query
      const comics = await Comic.findByCategory(categoryId, { page: parseInt(page), limit: parseInt(limit) });
      // Filter by access_status
      const filteredComics = comics.filter(comic => {
        if (isAdmin) return true;
        if (comic.access_status === 'open') return true;
        if (comic.access_status === 'vip' && isVip) return true;
        return false;
      });
      const total = await Comic.countByCategory(categoryId);

      return successResponse(res, {
        data: filteredComics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching comics by category:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getAllWithFilters(req, res) {
    try {
      const { 
        page = 1, 
        limit = 30, 
        search = '', 
        status = '', 
        country_id = '', 
        sort = '',
        includeCategories = '',
        excludeCategories = ''
      } = req.query;
      const isAdmin = req.user && req.user.role === 'admin';
      const isVip = req.user && (req.user.role === 'vip' || req.user.role === 'admin');
      const params = {
        page: parseInt(page),
        limit: parseInt(limit),
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

      return successResponse(res, {
        data: comics,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit)
        }
      });
    } catch (error) {
      console.error('Error fetching comics:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getLatest(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const comics = await Comic.findLatest(limit);
      return successResponse(res, comics);
    } catch (error) {
      console.error('Error fetching latest comics:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getPopular(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const comics = await Comic.findPopular(limit);
      return successResponse(res, comics);
    } catch (error) {
      console.error('Error fetching popular comics:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new ComicController();

