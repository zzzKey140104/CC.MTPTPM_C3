const express = require('express');
const router = express.Router();
const comicController = require('../controllers/comicController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', comicController.getAllWithFilters.bind(comicController));
router.get('/latest/updates', comicController.getLatest.bind(comicController));
router.get('/popular/list', comicController.getPopular.bind(comicController));
router.get('/category/:categoryId', comicController.getByCategory.bind(comicController));
router.post('/:id/views', comicController.incrementViews.bind(comicController)); // Endpoint riêng để tăng lượt xem
router.get('/:id', optionalAuth, comicController.getById.bind(comicController));

module.exports = router;

