const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const { optionalAuth } = require('../middleware/auth');

// Sử dụng optionalAuth để kiểm tra quyền admin nếu có token
router.get('/comic/:comicId', optionalAuth, chapterController.getByComicId.bind(chapterController));
router.post('/:id/views', chapterController.incrementViews.bind(chapterController)); // Endpoint riêng để tăng lượt xem
router.get('/:id', optionalAuth, chapterController.getById.bind(chapterController));

module.exports = router;

