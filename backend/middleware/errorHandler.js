const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Lỗi validation
  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400);
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token không hợp lệ', 401);
  }

  // Lỗi mặc định
  return errorResponse(res, 'Lỗi server', 500);
};

const notFound = (req, res) => {
  return errorResponse(res, 'Không tìm thấy route', 404);
};

module.exports = {
  errorHandler,
  notFound
};

