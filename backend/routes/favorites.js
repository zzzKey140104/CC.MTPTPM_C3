const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, favoriteController.getByUser.bind(favoriteController));
router.post('/toggle', authenticateToken, favoriteController.toggle.bind(favoriteController));
router.get('/check/:comicId', authenticateToken, favoriteController.check.bind(favoriteController));
router.get('/count', authenticateToken, favoriteController.getCount.bind(favoriteController));

module.exports = router;

