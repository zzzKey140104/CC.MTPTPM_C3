const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/comic/:comicId', commentController.getByComicId.bind(commentController));
router.get('/chapter/:chapterId', commentController.getByChapterId.bind(commentController));
router.get('/:id/like/check', authenticateToken, commentController.checkLike.bind(commentController));

// Protected routes
router.post('/', authenticateToken, commentController.create.bind(commentController));
router.post('/:id/like', authenticateToken, commentController.toggleLike.bind(commentController));
router.delete('/:id', authenticateToken, commentController.delete.bind(commentController));

module.exports = router;

