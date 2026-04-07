const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const Favorite = require('../models/Favorite');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const path = require('path');
const fs = require('fs');

class AdminController {
  async getAllComics(req, res) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const params = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isAdmin: true, // Admin cần thấy tất cả truyện, kể cả closed và vip
        isVip: true // Admin có quyền như VIP
      };

      const comics = await Comic.findAll(params);
      const total = await Comic.count(params);

      return successResponse(res, {
        data: comics,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit)
        }
      });
    } catch (error) {
      console.error('Error fetching comics:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async createComic(req, res) {
    try {
      const { title, author, description, status, country_id, category_ids, access_status } = req.body;
      
      if (!title) {
        return errorResponse(res, 'Vui lòng nhập tên truyện', 400);
      }

      // Tạo slug từ title
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Xử lý ảnh cover
      const cover_image = req.files?.cover_image 
        ? `/uploads/comics/${req.files.cover_image[0].filename}`
        : null;

      const comicId = await Comic.create({
        title,
        slug,
        author,
        description,
        cover_image,
        status: status || 'ongoing',
        country_id: country_id || null,
        access_status: access_status || 'open'
      });

      // Thêm thể loại
      if (category_ids) {
        const ids = Array.isArray(category_ids) ? category_ids : [category_ids].filter(Boolean);
        for (const categoryId of ids) {
          await db.promise.query(
            'INSERT INTO comic_categories (comic_id, category_id) VALUES (?, ?)',
            [comicId, categoryId]
          );
        }
      }

      return successResponse(res, { id: comicId }, 'Tạo truyện thành công', 201);
    } catch (error) {
      console.error('Error creating comic:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async updateComic(req, res) {
    try {
      const { id } = req.params;
      const { title, author, description, status, country_id, category_ids, access_status } = req.body;

      const updateData = {};
      if (title) updateData.title = title;
      if (author !== undefined) updateData.author = author;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;
      if (country_id !== undefined) updateData.country_id = country_id;
      if (access_status !== undefined) {
        if (!['open', 'closed', 'vip'].includes(access_status)) {
          return errorResponse(res, 'Trạng thái truy cập không hợp lệ', 400);
        }
        updateData.access_status = access_status;
      }

      // Xử lý ảnh cover mới
      if (req.files?.cover_image) {
        // Xóa ảnh cũ nếu có
        const comic = await Comic.findById(id);
        if (comic && comic.cover_image) {
          const oldImagePath = path.join(__dirname, '..', comic.cover_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updateData.cover_image = `/uploads/comics/${req.files.cover_image[0].filename}`;
      }

      await Comic.update(id, updateData);

      // Cập nhật thể loại
      if (category_ids !== undefined) {
        // Xóa thể loại cũ
        await db.promise.query('DELETE FROM comic_categories WHERE comic_id = ?', [id]);
        // Thêm thể loại mới
        const ids = Array.isArray(category_ids) ? category_ids : [category_ids].filter(Boolean);
        for (const categoryId of ids) {
          await db.promise.query(
            'INSERT INTO comic_categories (comic_id, category_id) VALUES (?, ?)',
            [id, categoryId]
          );
        }
      }

      // Kiểm tra nếu status được đổi thành completed
      if (status === 'completed') {
        const comic = await Comic.findById(id);
        if (comic) {
          // Tạo thông báo cho tất cả user đang theo dõi
          await Notification.createForAllFollowers(
            id,
            'comic_completed',
            `Truyện đã hoàn thành: ${comic.title}`,
            `${comic.title} mà bạn đang theo dõi đã hoàn thành`
          );
        }
      }

      return successResponse(res, null, 'Cập nhật truyện thành công');
    } catch (error) {
      console.error('Error updating comic:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async deleteComic(req, res) {
    try {
      const { id } = req.params;
      
      // Xóa ảnh cover
      const comic = await Comic.findById(id);
      if (comic && comic.cover_image) {
        const imagePath = path.join(__dirname, '..', comic.cover_image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      await Comic.delete(id);
      return successResponse(res, null, 'Xóa truyện thành công');
    } catch (error) {
      console.error('Error deleting comic:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async createChapter(req, res) {
    try {
      const { comic_id, chapter_number, title } = req.body;

      if (!comic_id || !chapter_number) {
        return errorResponse(res, 'Thiếu thông tin comic_id hoặc chapter_number', 400);
      }

      // Xử lý ảnh chương - upload nhiều ảnh
      const images = [];
      if (req.files?.chapter_images && req.files.chapter_images.length > 0) {
        const uploadDir = path.join(__dirname, '../uploads/chapters', comic_id.toString());
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Sắp xếp files theo thứ tự upload (theo tên file gốc hoặc thời gian)
        const sortedFiles = req.files.chapter_images.sort((a, b) => {
          return a.originalname.localeCompare(b.originalname) || a.filename.localeCompare(b.filename);
        });

        sortedFiles.forEach((file, index) => {
          // Tạo tên file với số thứ tự để đảm bảo thứ tự
          const pageNumber = String(index + 1).padStart(3, '0'); // 001, 002, 003...
          const fileExtension = path.extname(file.originalname);
          const newFilename = `page${pageNumber}_${Date.now()}_${index}${fileExtension}`;
          const newPath = path.join(uploadDir, newFilename);
          
          // Di chuyển file từ temp sang thư mục chính
          if (fs.existsSync(file.path)) {
            fs.renameSync(file.path, newPath);
            images.push(`/uploads/chapters/${comic_id}/${newFilename}`);
          }
        });
      }

      if (images.length === 0) {
        return errorResponse(res, 'Vui lòng upload ít nhất 1 ảnh cho chương', 400);
      }

      const chapterId = await Chapter.create({
        comic_id,
        chapter_number: parseInt(chapter_number),
        title,
        images: images, // Truyền array, model sẽ tự stringify
        status: req.body.status || 'open' // Mặc định là open, có thể là vip hoặc closed
      });

      // Cập nhật total_chapters
      await db.promise.query(
        'UPDATE comics SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE comic_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [comic_id, comic_id]
      );

      // Lấy thông tin truyện để tạo thông báo
      const comic = await Comic.findById(comic_id);
      if (comic) {
        // Tạo thông báo cho tất cả user đang theo dõi
        await Notification.createForAllFollowers(
          comic_id,
          'new_chapter',
          `Chương mới: ${comic.title}`,
          `${comic.title} mà bạn đang theo dõi vừa đăng chương ${chapter_number}${title ? `: ${title}` : ''}`,
          chapterId,
          parseInt(chapter_number)
        );

        // Gửi email thông báo cho các user đang theo dõi và đã xác nhận email
        const followers = await Favorite.findUsersByComicId(comic_id);
        
        // Gửi email bất đồng bộ (không chờ kết quả)
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
            // Không throw error để không ảnh hưởng đến việc tạo chapter
          }
        });
      }

      return successResponse(res, { id: chapterId }, 'Tạo chương thành công', 201);
    } catch (error) {
      console.error('Error creating chapter:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async updateChapter(req, res) {
    try {
      const { id } = req.params;
      const { title } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;

      // Xử lý ảnh mới nếu có
      if (req.files?.chapter_images && req.files.chapter_images.length > 0) {
        const chapter = await Chapter.findById(id);
        const comic_id = chapter.comic_id;

        // Xóa ảnh cũ
        if (chapter.images) {
          const oldImages = typeof chapter.images === 'string' 
            ? JSON.parse(chapter.images) 
            : chapter.images;
          if (Array.isArray(oldImages)) {
            oldImages.forEach(imagePath => {
              const fullPath = path.join(__dirname, '..', imagePath);
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            });
          }
        }

        // Lưu ảnh mới - upload nhiều ảnh
        const images = [];
        const uploadDir = path.join(__dirname, '../uploads/chapters', comic_id.toString());
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Sắp xếp files theo thứ tự
        const sortedFiles = req.files.chapter_images.sort((a, b) => {
          return a.originalname.localeCompare(b.originalname) || a.filename.localeCompare(b.filename);
        });

        sortedFiles.forEach((file, index) => {
          const pageNumber = String(index + 1).padStart(3, '0');
          const fileExtension = path.extname(file.originalname);
          const newFilename = `page${pageNumber}_${Date.now()}_${index}${fileExtension}`;
          const newPath = path.join(uploadDir, newFilename);
          
          if (fs.existsSync(file.path)) {
            fs.renameSync(file.path, newPath);
            images.push(`/uploads/chapters/${comic_id}/${newFilename}`);
          }
        });

        if (images.length > 0) {
          updateData.images = images; // Truyền array, model sẽ tự stringify
        }
      }

      await Chapter.update(id, updateData);
      return successResponse(res, null, 'Cập nhật chương thành công');
    } catch (error) {
      console.error('Error updating chapter:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async deleteChapter(req, res) {
    try {
      const { id } = req.params;
      
      const chapter = await Chapter.findById(id);
      if (chapter) {
        // Xóa ảnh
        if (chapter.images) {
          const images = typeof chapter.images === 'string' 
            ? JSON.parse(chapter.images) 
            : chapter.images;
          images.forEach(imagePath => {
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }

        const comic_id = chapter.comic_id;
        await Chapter.delete(id);

        // Cập nhật total_chapters
        await db.promise.query(
          'UPDATE comics SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE comic_id = ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [comic_id, comic_id]
        );
      }

      return successResponse(res, null, 'Xóa chương thành công');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async toggleChapterStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const chapter = await Chapter.findById(id);
      if (!chapter) {
        return errorResponse(res, 'Không tìm thấy chương', 404);
      }

      // Nếu có status trong body, dùng status đó, nếu không thì toggle
      let newStatus;
      if (status && ['open', 'closed', 'vip'].includes(status)) {
        newStatus = status;
      } else {
        // Toggle logic: open -> closed -> vip -> open
        if (chapter.status === 'open') {
          newStatus = 'closed';
        } else if (chapter.status === 'closed') {
          newStatus = 'vip';
        } else {
          newStatus = 'open';
        }
      }

      await Chapter.update(id, { status: newStatus });

      return successResponse(res, { status: newStatus }, 'Cập nhật trạng thái thành công');
    } catch (error) {
      console.error('Error toggling chapter status:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getClosedAndVipChapters(req, res) {
    try {
      const { comic_id } = req.params;
      const chapters = await Chapter.findClosedAndVipChapters(comic_id);
      return successResponse(res, chapters);
    } catch (error) {
      console.error('Error fetching closed/vip chapters:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getClosedAndVipComics(req, res) {
    try {
      const { search = '' } = req.query;
      const params = { search };
      const comics = await Comic.findClosedAndVipComics(params);
      return successResponse(res, comics);
    } catch (error) {
      console.error('Error fetching closed/vip comics:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getAllVipChapters(req, res) {
    try {
      const chapters = await Chapter.findAllVipAndClosedChapters();
      return successResponse(res, chapters);
    } catch (error) {
      console.error('Error fetching all VIP and closed chapters:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  // ===== User management (Admin) =====
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const params = {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      };

      const users = await User.findAll(params);
      const total = await User.count(params);

      return successResponse(res, {
        data: users,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { role, username, email, account_status, newPassword } = req.body;
      const bcrypt = require('bcryptjs');

      // Không cho admin tự hạ quyền/xóa chính mình thông qua endpoint này
      if (parseInt(id) === req.user.id) {
        return errorResponse(res, 'Không thể chỉnh sửa tài khoản của chính bạn tại đây', 400);
      }

      const updateData = {};
      if (role !== undefined) {
        if (!['reader', 'vip', 'admin'].includes(role)) {
          return errorResponse(res, 'Role không hợp lệ', 400);
        }
        updateData.role = role;
      }
      if (username !== undefined) {
        updateData.username = username;
      }
      if (email !== undefined) {
        // Kiểm tra email đã tồn tại chưa (trừ user hiện tại)
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return errorResponse(res, 'Email đã được sử dụng', 400);
        }
        updateData.email = email;
      }
      if (account_status !== undefined) {
        if (!['active', 'locked', 'banned'].includes(account_status)) {
          return errorResponse(res, 'Trạng thái tài khoản không hợp lệ', 400);
        }
        updateData.account_status = account_status;
      }
      if (newPassword !== undefined && newPassword.trim() !== '') {
        // Hash mật khẩu mới
        if (newPassword.length < 6) {
          return errorResponse(res, 'Mật khẩu phải có ít nhất 6 ký tự', 400);
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateData.password = hashedPassword;
      }

      if (Object.keys(updateData).length === 0) {
        return errorResponse(res, 'Không có dữ liệu để cập nhật', 400);
      }

      const updated = await User.update(id, updateData);
      if (!updated) {
        return errorResponse(res, 'Cập nhật thất bại', 404);
      }

      const user = await User.findById(id);
      return successResponse(res, user, 'Cập nhật user thành công');
    } catch (error) {
      console.error('Error updating user:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (parseInt(id) === req.user.id) {
        return errorResponse(res, 'Không thể xóa tài khoản của chính bạn', 400);
      }

      const deleted = await User.delete(id);
      if (!deleted) {
        return errorResponse(res, 'User không tồn tại', 404);
      }

      return successResponse(res, null, 'Xóa user thành công');
    } catch (error) {
      console.error('Error deleting user:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new AdminController();

