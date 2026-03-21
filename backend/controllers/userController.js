const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

class UserController {
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return errorResponse(res, 'Không tìm thấy user', 404);
      }

      return successResponse(res, user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return errorResponse(res, 'Không tìm thấy user', 404);
      }

      return successResponse(res, user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, password, newPassword } = req.body;

      const updateData = {};

      // Cập nhật username nếu có
      if (username) {
        updateData.username = username;
      }

      // Cập nhật avatar nếu có file upload
      if (req.file) {
        updateData.avatar = `/uploads/avatars/${req.file.filename}`;
      }

      // Cập nhật password nếu có
      if (password && newPassword) {
        const user = await User.findByEmail(req.user.email);
        if (!user) {
          return errorResponse(res, 'User không tồn tại', 404);
        }

        // Kiểm tra mật khẩu cũ
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return errorResponse(res, 'Mật khẩu cũ không đúng', 400);
        }

        // Mã hóa mật khẩu mới
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updateData).length === 0) {
        return errorResponse(res, 'Không có thông tin nào để cập nhật', 400);
      }

      const updated = await User.update(userId, updateData);
      if (!updated) {
        return errorResponse(res, 'Cập nhật thất bại', 500);
      }

      const updatedUser = await User.findById(userId);
      return successResponse(res, updatedUser, 'Cập nhật thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new UserController();

