const { successResponse, errorResponse } = require('../utils/response');
const notificationService = require('../services/notificationService');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { unreadOnly = false, limit = 50 } = req.query;

      const notifications = await notificationService.getNotifications(userId, {
        unreadOnly,
        limit
      });

      return successResponse(res, notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.getUnreadCount(userId);
      return successResponse(res, result);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await notificationService.markAsRead(userId, id);
      return successResponse(res, null, 'Đã đánh dấu đã đọc');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result = await notificationService.markAllAsRead(userId);
      return successResponse(res, result, 'Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      console.error('Error marking all as read:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new NotificationController();

