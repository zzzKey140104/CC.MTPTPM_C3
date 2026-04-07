const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const emailService = require('../utils/emailService');
const { createServiceError } = require('./serviceError');

class AuthService {
  resolveDeviceFromUserAgent(userAgent = '') {
    const ua = String(userAgent || '').toLowerCase();
    if (!ua) return 'Unknown device';
    if (ua.includes('android')) return 'Android device';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS device';
    if (ua.includes('windows')) return 'Windows browser';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS browser';
    if (ua.includes('linux')) return 'Linux browser';
    return 'Browser device';
  }

  async register({ username, email, password, file }) {
    if (!username || !email || !password) {
      throw createServiceError('Vui lòng điền đầy đủ thông tin', 400);
    }

    const emailExists = await User.emailExists(email);
    if (emailExists) {
      throw createServiceError('Email đã được sử dụng', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const avatar = file ? `/uploads/avatars/${file.filename}` : null;

    const userId = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar,
      email_verification_token: emailVerificationToken,
      email_verified: false
    });

    await emailService.sendVerificationEmail(email, emailVerificationToken, username);
    const newUser = await User.findById(userId);

    return {
      id: userId,
      username,
      email,
      avatar: newUser?.avatar,
      role: newUser?.role || 'reader'
    };
  }

  getSessionExpiresAt() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async login({ email, password, device_info, ip_address, user_agent }) {
    if (!email || !password) {
      throw createServiceError('Vui lòng điền đầy đủ thông tin', 400);
    }

    const user = await User.findByEmail(email);
    if (!user) {
      throw createServiceError('Email hoặc mật khẩu không đúng', 401);
    }

    if (user.account_status === 'locked' || user.account_status === 'banned') {
      throw createServiceError('Tài khoản của bạn đã bị khóa hoặc cấm vĩnh viễn. Vui lòng liên hệ quản trị viên để được hỗ trợ.', 403);
    }

    if (!user.password) {
      throw createServiceError('Tài khoản này được đăng nhập bằng Google. Vui lòng sử dụng Google để đăng nhập.', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createServiceError('Email hoặc mật khẩu không đúng', 401);
    }

    if (!user.google_id && !user.email_verified) {
      throw createServiceError('Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.', 403);
    }

    if (!process.env.JWT_SECRET) {
      throw createServiceError('Lỗi cấu hình server', 500);
    }

    const sessionId = await UserSession.create({
      user_id: user.id,
      refresh_token_hash: this.hashToken(`${user.id}_${Date.now()}_${Math.random()}`),
      device_info: device_info || null,
      ip_address: ip_address || null,
      user_agent: user_agent || null,
      expires_at: this.getSessionExpiresAt()
    });
    const token = jwt.sign({ id: user.id, email: user.email, session_id: sessionId }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    await UserSession.updateTokenHashById(sessionId, this.hashToken(token));

    return {
      token,
      session_id: sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'reader',
        avatar: user.avatar,
        account_status: user.account_status || 'active'
      }
    };
  }

  async verifyEmail(token) {
    if (!token) {
      throw createServiceError('Token không hợp lệ', 400);
    }

    const user = await User.findByVerificationToken(token);
    if (!user) {
      throw createServiceError('Token không hợp lệ hoặc đã hết hạn', 400);
    }

    if (user.email_verified) {
      return { alreadyVerified: true };
    }

    await User.verifyEmail(user.id);
    return { alreadyVerified: false };
  }

  async resendVerificationEmail(email) {
    if (!email) {
      throw createServiceError('Vui lòng nhập email', 400);
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return { silent: true };
    }

    if (user.email_verified) {
      throw createServiceError('Email đã được xác nhận', 400);
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    await User.update(user.id, { email_verification_token: emailVerificationToken });
    await emailService.sendVerificationEmail(user.email, emailVerificationToken, user.username);
    return { silent: false };
  }

  async forgotPassword(email) {
    if (!email) {
      throw createServiceError('Vui lòng nhập email', 400);
    }

    const user = await User.findByEmail(email);
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);
    await User.setPasswordResetToken(user.id, resetToken, resetExpires);
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.username);
  }

  async resetPassword({ token, password }) {
    if (!token || !password) {
      throw createServiceError('Vui lòng điền đầy đủ thông tin', 400);
    }
    if (password.length < 6) {
      throw createServiceError('Mật khẩu phải có ít nhất 6 ký tự', 400);
    }

    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      throw createServiceError('Token không hợp lệ hoặc đã hết hạn', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.update(user.id, { password: hashedPassword });
    await User.clearPasswordResetToken(user.id);
  }

  async googleCallback(googleUser, sessionMeta = {}) {
    if (!googleUser) {
      return { redirectPath: '/login?error=google_auth_failed' };
    }

    if (googleUser.needsPasswordSetup) {
      return {
        redirectPath: `/google-registration-success?email=${encodeURIComponent(googleUser.email)}`
      };
    }

    const sessionId = await UserSession.create({
      user_id: googleUser.id,
      refresh_token_hash: this.hashToken(`${googleUser.id}_${Date.now()}_${Math.random()}`),
      device_info: sessionMeta.device_info || this.resolveDeviceFromUserAgent(sessionMeta.user_agent),
      ip_address: sessionMeta.ip_address || null,
      user_agent: sessionMeta.user_agent || null,
      expires_at: this.getSessionExpiresAt()
    });
    const token = jwt.sign(
      { id: googleUser.id, email: googleUser.email, session_id: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await UserSession.updateTokenHashById(sessionId, this.hashToken(token));
    return { redirectPath: `/auth/google/callback?token=${token}` };
  }

  async setupPasswordForGoogle({ token, password, device_info, ip_address, user_agent }) {
    if (!token || !password) {
      throw createServiceError('Vui lòng điền đầy đủ thông tin', 400);
    }
    if (password.length < 6) {
      throw createServiceError('Mật khẩu phải có ít nhất 6 ký tự', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw createServiceError('Token không hợp lệ hoặc đã hết hạn', 400);
    }

    if (decoded.type !== 'google_registration') {
      throw createServiceError('Token không hợp lệ', 400);
    }

    const emailExists = await User.emailExists(decoded.email);
    if (emailExists) {
      throw createServiceError('Email đã được sử dụng. Vui lòng đăng nhập.', 400);
    }

    const googleIdExists = await User.findByGoogleId(decoded.google_id);
    if (googleIdExists) {
      throw createServiceError('Tài khoản Google này đã được đăng ký. Vui lòng đăng nhập.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({
      username: decoded.username,
      email: decoded.email,
      password: hashedPassword,
      avatar: decoded.avatar,
      google_id: decoded.google_id,
      email_verified: true
    });

    const newUser = await User.findById(userId);
    const sessionId = await UserSession.create({
      user_id: newUser.id,
      refresh_token_hash: this.hashToken(`${newUser.id}_${Date.now()}_${Math.random()}`),
      device_info: device_info || this.resolveDeviceFromUserAgent(user_agent),
      ip_address: ip_address || null,
      user_agent: user_agent || null,
      expires_at: this.getSessionExpiresAt()
    });
    const jwtToken = jwt.sign({ id: newUser.id, email: newUser.email, session_id: sessionId }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    await UserSession.updateTokenHashById(sessionId, this.hashToken(jwtToken));

    return {
      token: jwtToken,
      session_id: sessionId,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role || 'reader',
        avatar: newUser.avatar,
        account_status: newUser.account_status || 'active'
      }
    };
  }

  async getSessions(userId) {
    const sessions = await UserSession.findByUserId(userId);
    return sessions.map((session) => ({
      ...session,
      device_info: session.device_info || this.resolveDeviceFromUserAgent(session.user_agent),
      ip_address: session.ip_address || 'Unknown IP'
    }));
  }

  async revokeSession(userId, sessionId) {
    const revoked = await UserSession.revokeById(userId, sessionId);
    if (!revoked) {
      throw createServiceError('Không tìm thấy phiên đăng nhập', 404);
    }
    return { revoked: true };
  }

  async revokeAllSessions(userId) {
    const count = await UserSession.revokeAllByUserId(userId);
    return { revokedCount: count };
  }

  async logoutCurrentSession(userId, sessionId) {
    if (!sessionId) {
      return { revoked: false };
    }
    await UserSession.revokeById(userId, sessionId);
    return { revoked: true };
  }
}

module.exports = new AuthService();
