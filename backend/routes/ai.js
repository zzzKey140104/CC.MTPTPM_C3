const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');
const { authenticateToken } = require('../middleware/auth');

// Tóm tắt truyện
router.post('/comics/:comicId/summarize', optionalAuth, aiController.summarizeComic.bind(aiController));

// Tóm tắt chương
router.post('/chapters/:chapterId/summarize', optionalAuth, aiController.summarizeChapter.bind(aiController));

// Chat với AI
router.post('/chat', optionalAuth, aiController.chat.bind(aiController));
router.get('/chat/history', authenticateToken, aiController.getChatHistory.bind(aiController));
router.delete('/chat/history', authenticateToken, aiController.clearChatHistory.bind(aiController));
router.get('/usage/daily', authenticateToken, aiController.getDailyUsage.bind(aiController));
router.get('/usage/summary', authenticateToken, aiController.getUsageSummary.bind(aiController));

module.exports = router;

