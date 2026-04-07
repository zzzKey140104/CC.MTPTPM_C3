const Notification = require('../models/Notification');
const { createServiceError } = require('./serviceError');
const { emitToUser } = require('../socket');

class NotificationService {
  async getNotifications(userId, { unreadOnly = false, limit = 50 }) {
    return Notification.findByUserId(userId, {
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      limit: parseInt(limit, 10)
    });
  }

  async getUnreadCount(userId) {
    const count = await Notification.getUnreadCount(userId);
    return { count: count > 99 ? 99 : count };
  }

  async markAsRead(userId, id) {
    const updated = await Notification.markAsRead(id, userId);
    if (!updated) {
      throw createServiceError('Không tìm thấy thông báo', 404);
    }

    const unreadCount = await Notification.getUnreadCount(userId);
    emitToUser(userId, 'notification:read', { id: Number.parseInt(id, 10) });
    emitToUser(userId, 'notification:count', {
      count: unreadCount > 99 ? 99 : unreadCount
    });
  }

  async markAllAsRead(userId) {
    const count = await Notification.markAllAsRead(userId);
    emitToUser(userId, 'notification:read_all', {});
    emitToUser(userId, 'notification:count', { count: 0 });
    return { count };
  }
}

module.exports = new NotificationService();
