const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Middleware kiểm tra admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
  }
};

// Áp dụng authentication và admin check cho tất cả routes
router.use(authenticateToken);
router.use(isAdmin);

// Comics management
router.get('/comics', adminController.getAllComics.bind(adminController));
router.post('/comics', 
  upload.fields([{ name: 'cover_image', maxCount: 1 }]),
  adminController.createComic.bind(adminController)
);
router.put('/comics/:id',
  upload.fields([{ name: 'cover_image', maxCount: 1 }]),
  adminController.updateComic.bind(adminController)
);
router.delete('/comics/:id', adminController.deleteComic.bind(adminController));

// Chapters management
router.post('/chapters',
  upload.fields([{ name: 'chapter_images', maxCount: 100 }]), // Tăng lên 100 ảnh
  adminController.createChapter.bind(adminController)
);
router.put('/chapters/:id',
  upload.fields([{ name: 'chapter_images', maxCount: 100 }]), // Tăng lên 100 ảnh
  adminController.updateChapter.bind(adminController)
);
router.patch('/chapters/:id/status', adminController.toggleChapterStatus.bind(adminController));
router.delete('/chapters/:id', adminController.deleteChapter.bind(adminController));
router.get('/chapters/comic/:comic_id/closed-vip', adminController.getClosedAndVipChapters.bind(adminController));

// Users management
router.get('/users', adminController.getAllUsers.bind(adminController));
router.put('/users/:id', adminController.updateUser.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Get closed and VIP comics
router.get('/comics/closed-vip', adminController.getClosedAndVipComics.bind(adminController));
router.get('/chapters/vip-all', adminController.getAllVipChapters.bind(adminController));

module.exports = router;

