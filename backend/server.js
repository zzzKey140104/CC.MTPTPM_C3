const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const db = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { registerRoutes } = require('./routes');
const { initSocketServer } = require('./socket');
const {
  validateEnv,
  warnIfWeakJwtSecret,
  testDatabaseConnection,
  ensureUsedAiTable,
  ensureUserSessionsTable,
  ensureAiUsageStatsDailyTable
} = require('./services/bootstrapService');

// Load environment variables
const result = dotenv.config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET'
];
validateEnv(requiredEnvVars);
warnIfWeakJwtSecret(process.env.JWT_SECRET);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(compression()); // Nén responses để giảm kích thước dữ liệu
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
registerRoutes(app);

// Error handling middleware (phải đặt sau routes)
app.use(notFound);
app.use(errorHandler);

testDatabaseConnection(db);

const PORT = process.env.PORT || 5000;

if (!process.env.PORT) {
  console.log(`ℹ️  PORT không được cấu hình, sử dụng mặc định: ${PORT}`);
}

initSocketServer(server);

async function startServer() {
  try {
    await ensureUsedAiTable(db);
    await ensureUserSessionsTable(db);
    await ensureAiUsageStatsDailyTable(db);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to bootstrap database schema:', error.message);
    process.exit(1);
  }
}

startServer();

