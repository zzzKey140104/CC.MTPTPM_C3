const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/:id', authenticateToken, userController.getById.bind(userController));
router.get('/profile/me', authenticateToken, userController.getProfile.bind(userController));
router.put('/profile/me', authenticateToken, upload.single('avatar'), userController.updateProfile.bind(userController));

module.exports = router;

