const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/response');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { unreadOnly = false, limit = 50 } = req.query;

      const notifications = await Notification.findByUserId(userId, {
        unreadOnly: unreadOnly === 'true',
        limit: parseInt(limit)
      });

      return successResponse(res, notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.getUnreadCount(userId);
      return successResponse(res, { count: count > 99 ? 99 : count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const updated = await Notification.markAsRead(id, userId);
      if (!updated) {
        return errorResponse(res, 'Không tìm thấy thông báo', 404);
      }

      return successResponse(res, null, 'Đã đánh dấu đã đọc');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.markAllAsRead(userId);
      return successResponse(res, { count }, 'Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new NotificationController();

