const ReadingHistory = require('../models/ReadingHistory');
const { createServiceError } = require('./serviceError');

class HistoryService {
  async getByUser(userId, limit = 50) {
    return ReadingHistory.findByUserId(userId, parseInt(limit, 10));
  }

  async add(userId, comicId, chapterId) {
    if (!comicId || !chapterId) {
      throw createServiceError('Thiếu comicId hoặc chapterId', 400);
    }

    await ReadingHistory.addOrUpdate(userId, comicId, chapterId);
  }

  async getByComic(userId, comicId) {
    return ReadingHistory.findByUserAndComic(userId, comicId);
  }

  async delete(userId, comicId) {
    if (!comicId) {
      throw createServiceError('Thiếu comicId', 400);
    }
    await ReadingHistory.deleteByUserAndComic(userId, comicId);
  }

  async deleteAll(userId) {
    await ReadingHistory.deleteAllByUser(userId);
  }
}

module.exports = new HistoryService();
