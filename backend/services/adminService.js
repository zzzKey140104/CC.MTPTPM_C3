const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const Notification = require('../models/Notification');
const Favorite = require('../models/Favorite');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const db = require('../config/database');
const { emitToUser } = require('../socket');

const PROJECT_ROOT = path.join(__dirname, '..');

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toArray(value) {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function slugify(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resolvePublicPath(publicPath = '') {
  return path.join(PROJECT_ROOT, publicPath.replace(/^[/\\]/, ''));
}

function safeDeleteFile(publicPath = '') {
  if (!publicPath) return;
  const fullPath = resolvePublicPath(publicPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

function saveChapterImages(chapterFiles, comicId) {
  const images = [];
  const uploadDir = path.join(PROJECT_ROOT, 'uploads', 'chapters', comicId.toString());

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sortedFiles = chapterFiles.sort((a, b) => {
    return a.originalname.localeCompare(b.originalname) || a.filename.localeCompare(b.filename);
  });

  sortedFiles.forEach((file, index) => {
    const pageNumber = String(index + 1).padStart(3, '0');
    const fileExtension = path.extname(file.originalname);
    const newFilename = `page${pageNumber}_${Date.now()}_${index}${fileExtension}`;
    const newPath = path.join(uploadDir, newFilename);

    if (fs.existsSync(file.path)) {
      fs.renameSync(file.path, newPath);
      images.push(`/uploads/chapters/${comicId}/${newFilename}`);
    }
  });

  return images;
}

async function syncComicCategory(comicId, categoryIds) {
  await db.promise.query('DELETE FROM comic_categories WHERE comic_id = ?', [comicId]);
  for (const categoryId of categoryIds) {
    await db.promise.query(
      'INSERT INTO comic_categories (comic_id, category_id) VALUES (?, ?)',
      [comicId, categoryId]
    );
  }
}

async function refreshComicTotalChapters(comicId) {
  await db.promise.query(
    'UPDATE comics SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE comic_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [comicId, comicId]
  );
}

class AdminService {
  async emitFollowerNotifications(followerNotifications = []) {
    for (const item of followerNotifications) {
      const notification = await Notification.findByIdForUser(item.id, item.user_id);
      const unreadCount = await Notification.getUnreadCount(item.user_id);
      if (notification) {
        emitToUser(item.user_id, 'notification:new', { notification });
      }
      emitToUser(item.user_id, 'notification:count', {
        count: unreadCount > 99 ? 99 : unreadCount
      });
    }
  }

  async getAllComics({ page = 1, limit = 20, search = '' }) {
    const params = {
      page: toInt(page) || 1,
      limit: toInt(limit) || 20,
      search,
      isAdmin: true,
      isVip: true
    };

    const comics = await Comic.findAll(params);
    const total = await Comic.count(params);

    return {
      data: comics,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }

  async createComic({ body, files }) {
    const { title, author, description, status, country_id, category_ids, access_status } = body;
    if (!title) {
      throw createError('Vui lòng nhập tên truyện', 400);
    }

    const coverImage = files?.cover_image
      ? `/uploads/comics/${files.cover_image[0].filename}`
      : null;

    const comicId = await Comic.create({
      title,
      slug: slugify(title),
      author,
      description,
      cover_image: coverImage,
      status: status || 'ongoing',
      country_id: country_id || null,
      access_status: access_status || 'open'
    });

    const ids = toArray(category_ids);
    for (const categoryId of ids) {
      await db.promise.query(
        'INSERT INTO comic_categories (comic_id, category_id) VALUES (?, ?)',
        [comicId, categoryId]
      );
    }

    return { id: comicId };
  }

  async updateComic({ id, body, files }) {
    const { title, author, description, status, country_id, category_ids, access_status } = body;
    const updateData = {};

    if (title) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (country_id !== undefined) updateData.country_id = country_id;
    if (access_status !== undefined) {
      if (!['open', 'closed', 'vip'].includes(access_status)) {
        throw createError('Trạng thái truy cập không hợp lệ', 400);
      }
      updateData.access_status = access_status;
    }

    if (files?.cover_image) {
      const comic = await Comic.findById(id);
      if (comic && comic.cover_image) {
        safeDeleteFile(comic.cover_image);
      }
      updateData.cover_image = `/uploads/comics/${files.cover_image[0].filename}`;
    }

    await Comic.update(id, updateData);

    if (category_ids !== undefined) {
      await syncComicCategory(id, toArray(category_ids));
    }

    if (status === 'completed') {
      const comic = await Comic.findById(id);
      if (comic) {
        const createdNotifications = await Notification.createForAllFollowers(
          id,
          'comic_completed',
          `Truyện đã hoàn thành: ${comic.title}`,
          `${comic.title} mà bạn đang theo dõi đã hoàn thành`
        );
        await this.emitFollowerNotifications(createdNotifications);
      }
    }
  }

  async deleteComic(id) {
    const comic = await Comic.findById(id);
    if (comic && comic.cover_image) {
      safeDeleteFile(comic.cover_image);
    }
    await Comic.delete(id);
  }

  async createChapter({ body, files }) {
    const { comic_id, chapter_number, title } = body;
    if (!comic_id || !chapter_number) {
      throw createError('Thiếu thông tin comic_id hoặc chapter_number', 400);
    }

    const chapterFiles = files?.chapter_images || [];
    const images = saveChapterImages(chapterFiles, comic_id);
    if (images.length === 0) {
      throw createError('Vui lòng upload ít nhất 1 ảnh cho chương', 400);
    }

    const chapterId = await Chapter.create({
      comic_id,
      chapter_number: parseInt(chapter_number, 10),
      title,
      images,
      status: body.status || 'open'
    });

    await refreshComicTotalChapters(comic_id);

    const comic = await Comic.findById(comic_id);
    if (comic) {
      const createdNotifications = await Notification.createForAllFollowers(
        comic_id,
        'new_chapter',
        `Chương mới: ${comic.title}`,
        `${comic.title} mà bạn đang theo dõi vừa đăng chương ${chapter_number}${title ? `: ${title}` : ''}`,
        chapterId,
        parseInt(chapter_number, 10)
      );
      await this.emitFollowerNotifications(createdNotifications);

      const followers = await Favorite.findUsersByComicId(comic_id);
      followers.forEach(async (user) => {
        try {
          await emailService.sendNewChapterNotification(
            user.email,
            user.username,
            comic.title,
            chapter_number,
            title || '',
            comic.slug,
            chapterId
          );
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
        }
      });
    }

    return { id: chapterId };
  }

  async updateChapter({ id, body, files }) {
    const { title } = body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;

    const chapterFiles = files?.chapter_images || [];
    if (chapterFiles.length > 0) {
      const chapter = await Chapter.findById(id);
      const comicId = chapter.comic_id;

      if (chapter.images) {
        const oldImages = typeof chapter.images === 'string'
          ? JSON.parse(chapter.images)
          : chapter.images;
        if (Array.isArray(oldImages)) {
          oldImages.forEach((imagePath) => safeDeleteFile(imagePath));
        }
      }

      const images = saveChapterImages(chapterFiles, comicId);
      if (images.length > 0) {
        updateData.images = images;
      }
    }

    await Chapter.update(id, updateData);
  }

  async deleteChapter(id) {
    const chapter = await Chapter.findById(id);
    if (!chapter) return;

    if (chapter.images) {
      const images = typeof chapter.images === 'string'
        ? JSON.parse(chapter.images)
        : chapter.images;
      if (Array.isArray(images)) {
        images.forEach((imagePath) => safeDeleteFile(imagePath));
      }
    }

    const comicId = chapter.comic_id;
    await Chapter.delete(id);
    await refreshComicTotalChapters(comicId);
  }

  async toggleChapterStatus({ id, status }) {
    const chapter = await Chapter.findById(id);
    if (!chapter) {
      throw createError('Không tìm thấy chương', 404);
    }

    let newStatus;
    if (status && ['open', 'closed', 'vip'].includes(status)) {
      newStatus = status;
    } else if (chapter.status === 'open') {
      newStatus = 'closed';
    } else if (chapter.status === 'closed') {
      newStatus = 'vip';
    } else {
      newStatus = 'open';
    }

    await Chapter.update(id, { status: newStatus });
    return { status: newStatus };
  }

  async getClosedAndVipChapters(comicId) {
    return Chapter.findClosedAndVipChapters(comicId);
  }

  async getClosedAndVipComics({ search = '' }) {
    return Comic.findClosedAndVipComics({ search });
  }

  async getAllVipChapters() {
    return Chapter.findAllVipAndClosedChapters();
  }

  async getAllUsers({ page = 1, limit = 20, search = '' }) {
    const params = {
      page: toInt(page) || 1,
      limit: toInt(limit) || 20,
      search
    };
    const users = await User.findAll(params);
    const total = await User.count(params);

    return {
      data: users,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    };
  }

  async updateUser({ currentUserId, id, body }) {
    if (parseInt(id, 10) === currentUserId) {
      throw createError('Không thể chỉnh sửa tài khoản của chính bạn tại đây', 400);
    }

    const { role, username, email, account_status, newPassword } = body;
    const updateData = {};

    if (role !== undefined) {
      if (!['reader', 'vip', 'admin'].includes(role)) {
        throw createError('Role không hợp lệ', 400);
      }
      updateData.role = role;
    }

    if (username !== undefined) {
      updateData.username = username;
    }

    if (email !== undefined) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== parseInt(id, 10)) {
        throw createError('Email đã được sử dụng', 400);
      }
      updateData.email = email;
    }

    if (account_status !== undefined) {
      if (!['active', 'locked', 'banned'].includes(account_status)) {
        throw createError('Trạng thái tài khoản không hợp lệ', 400);
      }
      updateData.account_status = account_status;
    }

    if (newPassword !== undefined && newPassword.trim() !== '') {
      if (newPassword.length < 6) {
        throw createError('Mật khẩu phải có ít nhất 6 ký tự', 400);
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw createError('Không có dữ liệu để cập nhật', 400);
    }

    const updated = await User.update(id, updateData);
    if (!updated) {
      throw createError('Cập nhật thất bại', 404);
    }

    return User.findById(id);
  }

  async deleteUser({ currentUserId, id }) {
    if (parseInt(id, 10) === currentUserId) {
      throw createError('Không thể xóa tài khoản của chính bạn', 400);
    }

    const deleted = await User.delete(id);
    if (!deleted) {
      throw createError('User không tồn tại', 404);
    }
  }
}

module.exports = new AdminService();
