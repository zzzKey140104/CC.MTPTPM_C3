const Chapter = require('../models/Chapter');
const Comic = require('../models/Comic');
const { successResponse, errorResponse } = require('../utils/response');

class ChapterController {
  async getById(req, res) {
    try {
      const { id } = req.params;
      const chapter = await Chapter.findById(id);

      if (!chapter) {
        return errorResponse(res, 'Không tìm thấy chương', 404);
      }

      // Kiểm tra quyền truy cập
      const isAdmin = req.user && req.user.role === 'admin';
      const isVip = req.user && (req.user.role === 'vip' || req.user.role === 'admin');
      
      // Kiểm tra trạng thái chương
      if (chapter.status === 'closed' && !isAdmin) {
        return errorResponse(res, 'Chương này đã bị đóng và không thể xem', 403);
      }
      
      if (chapter.status === 'vip' && !isVip) {
        return errorResponse(res, 'Chương này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.', 403);
      }

      // Kiểm tra access_status của truyện
      const comic = await Comic.findById(chapter.comic_id, isVip, isAdmin);
      if (!comic) {
        return errorResponse(res, 'Truyện này không tồn tại hoặc bạn không có quyền truy cập', 404);
      }
      
      if (comic.access_status === 'closed' && !isAdmin) {
        return errorResponse(res, 'Truyện này đã bị đóng và không thể xem', 403);
      }
      
      if (comic.access_status === 'vip' && !isVip) {
        return errorResponse(res, 'Truyện này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.', 403);
      }

      const prevChapter = await Chapter.findPrevChapter(chapter.comic_id, chapter.chapter_number, isAdmin, isVip);
      const nextChapter = await Chapter.findNextChapter(chapter.comic_id, chapter.chapter_number, isAdmin, isVip);

      // Không tăng lượt xem ở đây nữa, sẽ tách riêng endpoint

      // Parse images nếu là string
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
        // Lọc bỏ null/empty/undefined
        chapter.images = chapter.images.filter(img => img && typeof img === 'string' && img.trim());
      } else {
        chapter.images = [];
      }
      
      console.log('Chapter images after parsing:', chapter.images);

      return successResponse(res, {
        ...chapter,
        comic: comic ? { id: comic.id, title: comic.title, slug: comic.slug } : null,
        prevChapter,
        nextChapter
      });
    } catch (error) {
      console.error('Error fetching chapter:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getByComicId(req, res) {
    try {
      const { comicId } = req.params;
      // Chỉ admin mới thấy các chương đã đóng
      const isAdmin = req.user && req.user.role === 'admin';
      const isVip = req.user && (req.user.role === 'vip' || req.user.role === 'admin');
      const chapters = await Chapter.findByComicId(comicId, isAdmin, isVip);
      return successResponse(res, chapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async incrementViews(req, res) {
    try {
      const { id } = req.params;
      const chapter = await Chapter.findById(id);
      
      if (!chapter) {
        return errorResponse(res, 'Không tìm thấy chương', 404);
      }

      // Tăng lượt xem chương
      await Chapter.incrementViews(id);
      
      // Cập nhật lượt xem truyện = tổng lượt xem các chương
      if (chapter.comic_id) {
        await Comic.updateViewsFromChapters(chapter.comic_id);
      }

      return successResponse(res, { message: 'Đã tăng lượt xem' });
    } catch (error) {
      console.error('Error incrementing views:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new ChapterController();

