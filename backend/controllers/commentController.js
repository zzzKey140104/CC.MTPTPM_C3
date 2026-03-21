const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const { successResponse, errorResponse } = require('../utils/response');
const { authenticateToken } = require('../middleware/auth');

class CommentController {
  async getByComicId(req, res) {
    try {
      const { comicId } = req.params;
      const { page = 1, limit = 5, sort = 'popular' } = req.query;
      
      const comments = await Comment.findByComicId(comicId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      });
      const total = await Comment.countByComicId(comicId);

      return successResponse(res, {
        data: comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getByChapterId(req, res) {
    try {
      const { chapterId } = req.params;
      const { page = 1, limit = 5, sort = 'popular' } = req.query;
      
      const comments = await Comment.findByChapterId(chapterId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      });
      const total = await Comment.countByChapterId(chapterId);

      return successResponse(res, {
        data: comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async create(req, res) {
    try {
      const userId = req.user.id;
      const { comic_id, chapter_id, parent_id, content } = req.body;

      if (!content || !content.trim()) {
        return errorResponse(res, 'Nội dung bình luận không được để trống', 400);
      }

      if (!comic_id && !chapter_id) {
        return errorResponse(res, 'Phải có comic_id hoặc chapter_id', 400);
      }

      const commentId = await Comment.create({
        user_id: userId,
        comic_id: comic_id || null,
        chapter_id: chapter_id || null,
        parent_id: parent_id || null,
        content: content.trim()
      });

      const comment = await Comment.findById(commentId);
      
      // Tạo thông báo
      try {
        const user = await User.findById(userId);
        
        // Lấy thông tin comic hoặc chapter để tạo message
        let comicTitle = '';
        let targetComicId = comic_id;
        let chapterNumber = null;
        
        if (chapter_id) {
          const chapter = await Chapter.findById(chapter_id);
          if (chapter) {
            chapterNumber = chapter.chapter_number;
            const comic = await Comic.findById(chapter.comic_id);
            if (comic) {
              comicTitle = comic.title;
              targetComicId = comic.id;
            }
          }
        } else if (comic_id) {
          const comic = await Comic.findById(comic_id);
          if (comic) {
            comicTitle = comic.title;
          }
        }
        
        if (parent_id) {
          // Đây là reply - gửi thông báo cho người viết comment gốc
          const parentComment = await Comment.findById(parent_id);
          if (parentComment && parentComment.user_id !== userId) {
            // Chỉ gửi nếu người reply không phải chính người viết comment gốc
            await Notification.create({
              user_id: parentComment.user_id,
              comic_id: targetComicId,
              type: 'new_comment',
              title: 'Có người trả lời bình luận của bạn',
              message: `${user.username} đã trả lời bình luận của bạn trong "${comicTitle}"${chapterNumber ? ` - Chương ${chapterNumber}` : ''}`,
              chapter_id: chapter_id || null,
              chapter_number: chapterNumber
            });
          }
        } else {
          // Đây là comment mới - gửi thông báo cho admin (trừ admin tự bình luận)
          const admins = await User.findAllAdmins();
          for (const admin of admins) {
            // Không gửi thông báo cho admin nếu chính admin đó bình luận
            if (admin.id !== userId) {
              await Notification.create({
                user_id: admin.id,
                comic_id: targetComicId,
                type: 'new_comment',
                title: 'Bình luận mới',
                message: `${user.username} đã bình luận trong "${comicTitle}"${chapterNumber ? ` - Chương ${chapterNumber}` : ''}`,
                chapter_id: chapter_id || null,
                chapter_number: chapterNumber
              });
            }
          }
        }
      } catch (notifError) {
        console.error('Error creating notification for comment:', notifError);
        // Không fail request nếu notification lỗi
      }
      
      return successResponse(res, comment, 201);
    } catch (error) {
      console.error('Error creating comment:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async toggleLike(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await Comment.toggleLike(userId, id);
      
      // Tạo thông báo cho người viết comment khi có người like (trừ khi người like chính là người viết)
      if (result.liked) {
        try {
          const comment = await Comment.findById(id);
          if (comment && comment.user_id !== userId) {
            // Lấy thông tin người like
            const liker = await User.findById(userId);
            const commentAuthor = await User.findById(comment.user_id);
            
            // Lấy thông tin comic/chapter
            let comicTitle = '';
            let targetComicId = comment.comic_id;
            let chapterNumber = null;
            
            if (comment.chapter_id) {
              const chapter = await Chapter.findById(comment.chapter_id);
              if (chapter) {
                chapterNumber = chapter.chapter_number;
                const comic = await Comic.findById(chapter.comic_id);
                if (comic) {
                  comicTitle = comic.title;
                  targetComicId = comic.id;
                }
              }
            } else if (comment.comic_id) {
              const comic = await Comic.findById(comment.comic_id);
              if (comic) {
                comicTitle = comic.title;
              }
            }
            
            // Tạo thông báo cho người viết comment
            await Notification.create({
              user_id: comment.user_id,
              comic_id: targetComicId,
              type: 'comment_liked',
              title: 'Bình luận được thích',
              message: `${liker.username} đã thích bình luận của bạn trong "${comicTitle}"${chapterNumber ? ` - Chương ${chapterNumber}` : ''}`,
              chapter_id: comment.chapter_id || null,
              chapter_number: chapterNumber
            });
          }
        } catch (notifError) {
          console.error('Error creating notification for comment like:', notifError);
          // Không fail request nếu notification lỗi
        }
      }
      
      return successResponse(res, result);
    } catch (error) {
      console.error('Error toggling like:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async checkLike(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const isLiked = await Comment.checkLike(userId, id);
      return successResponse(res, { isLiked });
    } catch (error) {
      console.error('Error checking like:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await Comment.delete(id, userId);
      if (!deleted) {
        return errorResponse(res, 'Không tìm thấy bình luận hoặc không có quyền xóa', 404);
      }

      return successResponse(res, { message: 'Đã xóa bình luận' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new CommentController();

