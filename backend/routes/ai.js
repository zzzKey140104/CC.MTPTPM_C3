const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

// Tóm tắt truyện
router.post('/comics/:comicId/summarize', optionalAuth, aiController.summarizeComic.bind(aiController));

// Tóm tắt chương
router.post('/chapters/:chapterId/summarize', optionalAuth, aiController.summarizeChapter.bind(aiController));

// Chat với AI
router.post('/chat', optionalAuth, aiController.chat.bind(aiController));

module.exports = router;

