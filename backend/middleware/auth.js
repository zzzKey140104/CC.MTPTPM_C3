const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

const verifyToken = promisify(jwt.verify);

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return errorResponse(res, 'Token không được cung cấp', 401);
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ Lỗi: JWT_SECRET không được cấu hình trong file .env');
      return errorResponse(res, 'Lỗi cấu hình server', 500);
    }

    const decoded = await verifyToken(token, process.env.JWT_SECRET);

    // Lấy thông tin user từ database để có role và account_status
    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, 'User không tồn tại', 404);
    }

    // Kiểm tra account_status
    if (user.account_status === 'locked' || user.account_status === 'banned') {
      return errorResponse(res, 'Tài khoản của bạn đã bị khóa hoặc cấm. Vui lòng liên hệ quản trị viên.', 403);
    }

    req.user = {
      id: user.id,
      email: decoded.email,
      role: user.role || 'reader',
      account_status: user.account_status || 'active'
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token không hợp lệ', 403);
    }
    console.error('Error in authenticateToken:', error);
    return errorResponse(res, 'Lỗi xác thực', 500);
  }
};

// Optional authentication - không bắt buộc phải có token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // Không có token, tiếp tục nhưng không set req.user
      return next();
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      // Nếu không có JWT_SECRET, bỏ qua authentication
      return next();
    }

    try {
      const decoded = await verifyToken(token, process.env.JWT_SECRET);
      
      // Lấy thông tin user từ database để có role và account_status
      const user = await User.findById(decoded.id);
      if (user) {
        // Kiểm tra account_status - nếu bị khóa/cấm thì không set req.user
        if (user.account_status === 'locked' || user.account_status === 'banned') {
          // Không set req.user, nhưng vẫn cho phép request tiếp tục (optional auth)
        } else {
          req.user = {
            id: user.id,
            email: decoded.email,
            role: user.role || 'reader',
            account_status: user.account_status || 'active'
          };
        }
      }
    } catch (error) {
      // Token không hợp lệ, nhưng không báo lỗi - chỉ không set req.user
      // Cho phép request tiếp tục
    }
    
    next();
  } catch (error) {
    // Lỗi khác, nhưng vẫn cho phép request tiếp tục
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};

