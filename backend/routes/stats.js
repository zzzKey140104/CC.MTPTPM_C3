const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/auth');

// Tất cả routes yêu cầu đăng nhập
router.get('/me', authenticateToken, statsController.getMyStats);
router.get('/recommendations', authenticateToken, statsController.getRecommendations);

module.exports = router;
