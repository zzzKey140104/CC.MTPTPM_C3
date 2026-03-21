const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { authenticateToken } = require('../middleware/auth');

router.post('/toggle', authenticateToken, likeController.toggle.bind(likeController));
router.get('/check/:comicId', authenticateToken, likeController.check.bind(likeController));

module.exports = router;

