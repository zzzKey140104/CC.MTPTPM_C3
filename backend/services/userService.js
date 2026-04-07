const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createServiceError } = require('./serviceError');

class UserService {
  async getById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw createServiceError('Không tìm thấy user', 404);
    }
    return user;
  }

  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw createServiceError('Không tìm thấy user', 404);
    }
    return user;
  }

  async updateProfile({ userId, userEmail, username, password, newPassword, file }) {
    const updateData = {};

    if (username) {
      updateData.username = username;
    }

    if (file) {
      updateData.avatar = `/uploads/avatars/${file.filename}`;
    }

    if (password && newPassword) {
      const user = await User.findByEmail(userEmail);
      if (!user) {
        throw createServiceError('User không tồn tại', 404);
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw createServiceError('Mật khẩu cũ không đúng', 400);
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw createServiceError('Không có thông tin nào để cập nhật', 400);
    }

    const updated = await User.update(userId, updateData);
    if (!updated) {
      throw createServiceError('Cập nhật thất bại', 500);
    }

    return User.findById(userId);
  }
}

module.exports = new UserService();
