const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, notificationController.getNotifications.bind(notificationController));
router.get('/count', authenticateToken, notificationController.getUnreadCount.bind(notificationController));
router.put('/:id/read', authenticateToken, notificationController.markAsRead.bind(notificationController));
router.put('/read-all', authenticateToken, notificationController.markAllAsRead.bind(notificationController));

module.exports = router;

