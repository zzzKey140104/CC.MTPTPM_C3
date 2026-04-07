const Chapter = require('../models/Chapter');
const Comic = require('../models/Comic');
const { createServiceError } = require('./serviceError');

class ChapterService {
  parseChapterImages(chapter) {
    if (chapter.images) {
      if (typeof chapter.images === 'string') {
        try {
          const parsed = JSON.parse(chapter.images);
          chapter.images = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Error parsing chapter images:', e, 'Raw:', chapter.images);
          chapter.images = [];
        }
      } else if (!Array.isArray(chapter.images)) {
        chapter.images = [];
      }
      chapter.images = chapter.images.filter((img) => img && typeof img === 'string' && img.trim());
    } else {
      chapter.images = [];
    }
    return chapter;
  }

  async getById({ id, user }) {
    const chapter = await Chapter.findById(id);
    if (!chapter) {
      throw createServiceError('Không tìm thấy chương', 404);
    }

    const isAdmin = user && user.role === 'admin';
    const isVip = user && (user.role === 'vip' || user.role === 'admin');

    if (chapter.status === 'closed' && !isAdmin) {
      throw createServiceError('Chương này đã bị đóng và không thể xem', 403);
    }
    if (chapter.status === 'vip' && !isVip) {
      throw createServiceError('Chương này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.', 403);
    }

    const comic = await Comic.findById(chapter.comic_id, isVip, isAdmin);
    if (!comic) {
      throw createServiceError('Truyện này không tồn tại hoặc bạn không có quyền truy cập', 404);
    }
    if (comic.access_status === 'closed' && !isAdmin) {
      throw createServiceError('Truyện này đã bị đóng và không thể xem', 403);
    }
    if (comic.access_status === 'vip' && !isVip) {
      throw createServiceError('Truyện này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.', 403);
    }

    const prevChapter = await Chapter.findPrevChapter(chapter.comic_id, chapter.chapter_number, isAdmin, isVip);
    const nextChapter = await Chapter.findNextChapter(chapter.comic_id, chapter.chapter_number, isAdmin, isVip);
    const parsedChapter = this.parseChapterImages(chapter);
    console.log('Chapter images after parsing:', parsedChapter.images);

    return {
      ...parsedChapter,
      comic: comic ? { id: comic.id, title: comic.title, slug: comic.slug } : null,
      prevChapter,
      nextChapter
    };
  }

  async getByComicId({ comicId, user }) {
    const isAdmin = user && user.role === 'admin';
    const isVip = user && (user.role === 'vip' || user.role === 'admin');
    return Chapter.findByComicId(comicId, isAdmin, isVip);
  }

  async incrementViews(id) {
    const chapter = await Chapter.findById(id);
    if (!chapter) {
      throw createServiceError('Không tìm thấy chương', 404);
    }

    await Chapter.incrementViews(id);
    if (chapter.comic_id) {
      await Comic.updateViewsFromChapters(chapter.comic_id);
    }

    return { message: 'Đã tăng lượt xem' };
  }
}

module.exports = new ChapterService();
