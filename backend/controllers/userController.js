const { successResponse, errorResponse } = require('../utils/response');
const userService = require('../services/userService');

class UserController {
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getById(id);
      return successResponse(res, user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await userService.getProfile(userId);
      return successResponse(res, user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, password, newPassword } = req.body;
      const updatedUser = await userService.updateProfile({
        userId,
        userEmail: req.user.email,
        username,
        password,
        newPassword,
        file: req.file
      });
      return successResponse(res, updatedUser, 'Cập nhật thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new UserController();

