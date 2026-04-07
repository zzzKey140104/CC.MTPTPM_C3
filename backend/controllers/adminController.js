const { successResponse, errorResponse } = require('../utils/response');
const adminService = require('../services/adminService');

class AdminController {
  handleError(res, context, error) {
    console.error(`${context}:`, error);
    return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
  }

  async getAllComics(req, res) {
    try {
      const result = await adminService.getAllComics(req.query);
      return successResponse(res, result);
    } catch (error) {
      return this.handleError(res, 'Error fetching comics', error);
    }
  }

  async createComic(req, res) {
    try {
      const result = await adminService.createComic({ body: req.body, files: req.files });
      return successResponse(res, result, 'Tạo truyện thành công', 201);
    } catch (error) {
      return this.handleError(res, 'Error creating comic', error);
    }
  }

  async updateComic(req, res) {
    try {
      await adminService.updateComic({ id: req.params.id, body: req.body, files: req.files });
      return successResponse(res, null, 'Cập nhật truyện thành công');
    } catch (error) {
      return this.handleError(res, 'Error updating comic', error);
    }
  }

  async deleteComic(req, res) {
    try {
      await adminService.deleteComic(req.params.id);
      return successResponse(res, null, 'Xóa truyện thành công');
    } catch (error) {
      return this.handleError(res, 'Error deleting comic', error);
    }
  }

  async createChapter(req, res) {
    try {
      const result = await adminService.createChapter({ body: req.body, files: req.files });
      return successResponse(res, result, 'Tạo chương thành công', 201);
    } catch (error) {
      return this.handleError(res, 'Error creating chapter', error);
    }
  }

  async updateChapter(req, res) {
    try {
      await adminService.updateChapter({ id: req.params.id, body: req.body, files: req.files });
      return successResponse(res, null, 'Cập nhật chương thành công');
    } catch (error) {
      return this.handleError(res, 'Error updating chapter', error);
    }
  }

  async deleteChapter(req, res) {
    try {
      await adminService.deleteChapter(req.params.id);
      return successResponse(res, null, 'Xóa chương thành công');
    } catch (error) {
      return this.handleError(res, 'Error deleting chapter', error);
    }
  }

  async toggleChapterStatus(req, res) {
    try {
      const result = await adminService.toggleChapterStatus({
        id: req.params.id,
        status: req.body.status
      });
      return successResponse(res, result, 'Cập nhật trạng thái thành công');
    } catch (error) {
      return this.handleError(res, 'Error toggling chapter status', error);
    }
  }

  async getClosedAndVipChapters(req, res) {
    try {
      const result = await adminService.getClosedAndVipChapters(req.params.comic_id);
      return successResponse(res, result);
    } catch (error) {
      return this.handleError(res, 'Error fetching closed/vip chapters', error);
    }
  }

  async getClosedAndVipComics(req, res) {
    try {
      const result = await adminService.getClosedAndVipComics(req.query);
      return successResponse(res, result);
    } catch (error) {
      return this.handleError(res, 'Error fetching closed/vip comics', error);
    }
  }

  async getAllVipChapters(req, res) {
    try {
      const result = await adminService.getAllVipChapters();
      return successResponse(res, result);
    } catch (error) {
      return this.handleError(res, 'Error fetching all VIP and closed chapters', error);
    }
  }

  // ===== User management (Admin) =====
  async getAllUsers(req, res) {
    try {
      const result = await adminService.getAllUsers(req.query);
      return successResponse(res, result);
    } catch (error) {
      return this.handleError(res, 'Error fetching users', error);
    }
  }

  async updateUser(req, res) {
    try {
      const user = await adminService.updateUser({
        currentUserId: req.user.id,
        id: req.params.id,
        body: req.body
      });
      return successResponse(res, user, 'Cập nhật user thành công');
    } catch (error) {
      return this.handleError(res, 'Error updating user', error);
    }
  }

  async deleteUser(req, res) {
    try {
      await adminService.deleteUser({
        currentUserId: req.user.id,
        id: req.params.id
      });
      return successResponse(res, null, 'Xóa user thành công');
    } catch (error) {
      return this.handleError(res, 'Error deleting user', error);
    }
  }
}

module.exports = new AdminController();

