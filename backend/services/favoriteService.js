const Favorite = require('../models/Favorite');
const { createServiceError } = require('./serviceError');

class FavoriteService {
  async getByUser(userId) {
    return Favorite.findByUserId(userId);
  }

  async toggle(userId, comicId) {
    if (!comicId) {
      throw createServiceError('Thiếu comicId', 400);
    }

    const isFavorite = await Favorite.checkFavorite(userId, comicId);
    if (isFavorite) {
      await Favorite.remove(userId, comicId);
      return { isFavorite: false, message: 'Đã bỏ theo dõi' };
    }

    await Favorite.add(userId, comicId);
    return { isFavorite: true, message: 'Đã thêm vào theo dõi' };
  }

  async check(userId, comicId) {
    const isFavorite = await Favorite.checkFavorite(userId, comicId);
    return { isFavorite };
  }

  async getCount(userId) {
    const count = await Favorite.getCountByUserId(userId);
    return { count };
  }
}

module.exports = new FavoriteService();
