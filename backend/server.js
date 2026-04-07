const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load environment variables
const result = dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Lỗi: Thiếu các biến môi trường bắt buộc:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Vui lòng tạo file .env trong thư mục backend với các biến môi trường cần thiết.');
  console.error('   Bạn có thể copy từ file .env.example:');
  console.error('   Windows: copy .env.example .env');
  console.error('   Linux/Mac: cp .env.example .env\n');
  process.exit(1);
}

// Warn if using default JWT_SECRET (not secure)
if (process.env.JWT_SECRET === 'your_secret_key_here_change_in_production') {
  console.warn('⚠️  Cảnh báo: Bạn đang sử dụng JWT_SECRET mặc định. Hãy thay đổi trong file .env để bảo mật hơn!');
}

const app = express();

// Middleware
app.use(compression()); // Nén responses để giảm kích thước dữ liệu
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/comics', require('./routes/comics'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/countries', require('./routes/countries'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/history', require('./routes/history'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/payments', require('./routes/payments'));

// Error handling middleware (phải đặt sau routes)
app.use(notFound);
app.use(errorHandler);

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

const PORT = process.env.PORT || 5000;

if (!process.env.PORT) {
  console.log(`ℹ️  PORT không được cấu hình, sử dụng mặc định: ${PORT}`);
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

