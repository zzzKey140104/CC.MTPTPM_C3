const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioInstance = null;

const ROOM_PREFIX = {
  user: 'user:',
  comic: 'comic:',
  chapter: 'chapter:'
};

function parseToken(socket) {
  const authToken = socket.handshake?.auth?.token;
  if (authToken) {
    return authToken.replace(/^Bearer\s+/i, '').trim();
  }

  const authorizationHeader = socket.handshake?.headers?.authorization;
  if (!authorizationHeader) return null;
  return authorizationHeader.replace(/^Bearer\s+/i, '').trim();
}

async function socketAuthMiddleware(socket, next) {
  try {
    const token = parseToken(socket);
    if (!token) {
      socket.user = null;
      return next();
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error('Lỗi cấu hình server'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('User không tồn tại'));
    }

    if (user.account_status === 'locked' || user.account_status === 'banned') {
      return next(new Error('Tài khoản đã bị khóa hoặc cấm'));
    }

    socket.user = {
      id: user.id,
      role: user.role || 'reader',
      email: user.email
    };

    return next();
  } catch (error) {
    return next(new Error('Token không hợp lệ'));
  }
}

function toPositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

function registerRoomHandlers(socket) {
  socket.on('join_comic', (comicId) => {
    const id = toPositiveInt(comicId);
    if (!id) return;
    socket.join(`${ROOM_PREFIX.comic}${id}`);
  });

  socket.on('leave_comic', (comicId) => {
    const id = toPositiveInt(comicId);
    if (!id) return;
    socket.leave(`${ROOM_PREFIX.comic}${id}`);
  });

  socket.on('join_chapter', (chapterId) => {
    const id = toPositiveInt(chapterId);
    if (!id) return;
    socket.join(`${ROOM_PREFIX.chapter}${id}`);
  });

  socket.on('leave_chapter', (chapterId) => {
    const id = toPositiveInt(chapterId);
    if (!id) return;
    socket.leave(`${ROOM_PREFIX.chapter}${id}`);
  });
}

function initSocketServer(server) {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.use(socketAuthMiddleware);

  ioInstance.on('connection', (socket) => {
    if (socket.user?.id) {
      socket.join(`${ROOM_PREFIX.user}${socket.user.id}`);
    }

    registerRoomHandlers(socket);
  });

  return ioInstance;
}

function getSocketServer() {
  return ioInstance;
}

function emitToUser(userId, eventName, payload) {
  if (!ioInstance) return;
  ioInstance.to(`${ROOM_PREFIX.user}${userId}`).emit(eventName, payload);
}

function emitToComic(comicId, eventName, payload) {
  if (!ioInstance || !comicId) return;
  ioInstance.to(`${ROOM_PREFIX.comic}${comicId}`).emit(eventName, payload);
}

function emitToChapter(chapterId, eventName, payload) {
  if (!ioInstance || !chapterId) return;
  ioInstance.to(`${ROOM_PREFIX.chapter}${chapterId}`).emit(eventName, payload);
}

module.exports = {
  initSocketServer,
  getSocketServer,
  emitToUser,
  emitToComic,
  emitToChapter
};
