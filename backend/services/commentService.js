const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const { createServiceError } = require('./serviceError');
const { emitToUser, emitToComic, emitToChapter } = require('../socket');

class CommentService {
  async getByComicId(comicId, { page = 1, limit = 5, sort = 'popular' }) {
    const comments = await Comment.findByComicId(comicId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort
    });
    const total = await Comment.countByComicId(comicId);
    return {
      data: comments,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  async getByChapterId(chapterId, { page = 1, limit = 5, sort = 'popular' }) {
    const comments = await Comment.findByChapterId(chapterId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort
    });
    const total = await Comment.countByChapterId(chapterId);
    return {
      data: comments,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    };
  }

  async create(userId, { comic_id, chapter_id, parent_id, content }) {
    if (!content || !content.trim()) {
      throw createServiceError('Nội dung bình luận không được để trống', 400);
    }
    if (!comic_id && !chapter_id) {
      throw createServiceError('Phải có comic_id hoặc chapter_id', 400);
    }

    const commentId = await Comment.create({
      user_id: userId,
      comic_id: comic_id || null,
      chapter_id: chapter_id || null,
      parent_id: parent_id || null,
      content: content.trim()
    });

    const comment = await Comment.findById(commentId);
    this.createCommentNotification(userId, { comic_id, chapter_id, parent_id }).catch((e) => {
      console.error('Error creating notification for comment:', e);
    });

    if (comment?.comic_id) {
      emitToComic(comment.comic_id, 'comment:created', {
        comment
      });
    }
    if (comment?.chapter_id) {
      emitToChapter(comment.chapter_id, 'comment:created', {
        comment
      });
    }

    return comment;
  }

  async createCommentNotification(userId, { comic_id, chapter_id, parent_id }) {
    const user = await User.findById(userId);
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
      if (comic) comicTitle = comic.title;
    }

    if (parent_id) {
      const parentComment = await Comment.findById(parent_id);
      if (parentComment && parentComment.user_id !== userId) {
        const notificationId = await Notification.create({
          user_id: parentComment.user_id,
          comic_id: targetComicId,
          type: 'new_comment',
          title: 'Có người trả lời bình luận của bạn',
          message: `${user.username} đã trả lời bình luận của bạn trong "${comicTitle}"${chapterNumber ? ` - Chương ${chapterNumber}` : ''}`,
          chapter_id: chapter_id || null,
          chapter_number: chapterNumber
        });
        await this.emitNotificationUpdates(parentComment.user_id, notificationId);
      }
      return;
    }

    const admins = await User.findAllAdmins();
    for (const admin of admins) {
      if (admin.id !== userId) {
        const notificationId = await Notification.create({
          user_id: admin.id,
          comic_id: targetComicId,
          type: 'new_comment',
          title: 'Bình luận mới',
          message: `${user.username} đã bình luận trong "${comicTitle}"${chapterNumber ? ` - Chương ${chapterNumber}` : ''}`,
          chapter_id: chapter_id || null,
          chapter_number: chapterNumber
        });
        await this.emitNotificationUpdates(admin.id, notificationId);
      }
    }
  }

  async toggleLike(userId, id) {
    const result = await Comment.toggleLike(userId, id);
    const likedComment = await Comment.findById(id);

    if (likedComment?.comic_id) {
      emitToComic(likedComment.comic_id, 'comment:like_toggled', {
        commentId: likedComment.id,
        liked: result.liked,
        likes_count: likedComment.likes_count,
        comic_id: likedComment.comic_id,
        chapter_id: likedComment.chapter_id
      });
    }
    if (likedComment?.chapter_id) {
      emitToChapter(likedComment.chapter_id, 'comment:like_toggled', {
        commentId: likedComment.id,
        liked: result.liked,
        likes_count: likedComment.likes_count,
        comic_id: likedComment.comic_id,
        chapter_id: likedComment.chapter_id
      });
    }

    if (result.liked) {
      this.createCommentLikeNotification(userId, id).catch((e) => {
        console.error('Error creating notification for comment like:', e);
      });
    }
    return result;
  }

  async createCommentLikeNotification(userId, id) {
    const comment = await Comment.findById(id);
    if (!comment || comment.user_id === userId) return;

    const liker = await User.findById(userId);
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
      if (comic) comicTitle = comic.title;
    }

    const notificationId = await Notification.create({
      user_id: comment.user_id,
      comic_id: targetComicId,
      type: 'comment_liked',
      title: 'Bình luận được thích',
      message: `${liker.username} đã thích bình luận của bạn trong "${comicTitle}"${chapterNumber ? ` - Chương ${chapterNumber}` : ''}`,
      chapter_id: comment.chapter_id || null,
      chapter_number: chapterNumber
    });
    await this.emitNotificationUpdates(comment.user_id, notificationId);
  }

  async checkLike(userId, id) {
    const isLiked = await Comment.checkLike(userId, id);
    return { isLiked };
  }

  async delete(userId, id) {
    const comment = await Comment.findById(id);
    const deleted = await Comment.delete(id, userId);
    if (!deleted) {
      throw createServiceError('Không tìm thấy bình luận hoặc không có quyền xóa', 404);
    }

    if (comment?.comic_id) {
      emitToComic(comment.comic_id, 'comment:deleted', {
        id: comment.id,
        parent_id: comment.parent_id,
        comic_id: comment.comic_id,
        chapter_id: comment.chapter_id
      });
    }
    if (comment?.chapter_id) {
      emitToChapter(comment.chapter_id, 'comment:deleted', {
        id: comment.id,
        parent_id: comment.parent_id,
        comic_id: comment.comic_id,
        chapter_id: comment.chapter_id
      });
    }
  }

  async emitNotificationUpdates(userId, notificationId) {
    const [notification, unreadCount] = await Promise.all([
      Notification.findByIdForUser(notificationId, userId),
      Notification.getUnreadCount(userId)
    ]);

    if (notification) {
      emitToUser(userId, 'notification:new', { notification });
    }
    emitToUser(userId, 'notification:count', {
      count: unreadCount > 99 ? 99 : unreadCount
    });
  }
}

module.exports = new CommentService();
