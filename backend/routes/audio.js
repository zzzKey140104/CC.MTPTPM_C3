const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Lấy thông tin audio của một chương
// GET /api/audio/chapter/:chapterId
router.get('/chapter/:chapterId', optionalAuth, audioController.getChapterAudio);

// Tạo audio cho một chương
// POST /api/audio/chapter/:chapterId
// Body: { voice?: string, rate?: string, forceRecreate?: boolean }
router.post('/chapter/:chapterId', authenticateToken, audioController.createChapterAudio);

// Xóa audio của một chương
// DELETE /api/audio/chapter/:chapterId
router.delete('/chapter/:chapterId', authenticateToken, audioController.deleteChapterAudio);

// Lấy trạng thái xử lý audio của một chương
// GET /api/audio/chapter/:chapterId/status
router.get('/chapter/:chapterId/status', audioController.getProcessingStatus);

// Lấy trạng thái sẵn sàng để phát audio (nhẹ, phù hợp polling)
// GET /api/audio/chapter/:chapterId/readiness
router.get('/chapter/:chapterId/readiness', audioController.getReadiness);

// Lấy danh sách giọng nói có sẵn
// GET /api/audio/voices
router.get('/voices', audioController.getAvailableVoices);

// Tạo audio cho nhiều chương của một truyện
// POST /api/audio/comic/:comicId/generate
// Body: { 
//   voice?: string, 
//   rate?: string, 
//   startChapter?: number, 
//   endChapter?: number,
//   chaptersList?: number[] 
// }
router.post('/comic/:comicId/generate', authenticateToken, audioController.generateAudioForComicChapters);

module.exports = router;
