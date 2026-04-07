const Like = require('../models/Like');
const { createServiceError } = require('./serviceError');

class LikeService {
  async toggle(userId, comicId) {
    if (!comicId) {
      throw createServiceError('Thiếu comicId', 400);
    }

    const isLiked = await Like.checkLike(userId, comicId);
    if (isLiked) {
      await Like.remove(userId, comicId);
      return { isLiked: false, message: 'Đã bỏ thích' };
    }

    await Like.add(userId, comicId);
    return { isLiked: true, message: 'Đã thích' };
  }

  async check(userId, comicId) {
    const isLiked = await Like.checkLike(userId, comicId);
    return { isLiked };
  }
}

module.exports = new LikeService();
