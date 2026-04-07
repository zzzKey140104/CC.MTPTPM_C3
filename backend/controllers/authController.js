const { successResponse, errorResponse } = require("../utils/response");
const authService = require('../services/authService');

class AuthController {
  resolveClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || null;
  }

  resolveDeviceInfo(req) {
    const explicitDeviceInfo = req.body?.device_info;
    if (explicitDeviceInfo && String(explicitDeviceInfo).trim()) {
      return String(explicitDeviceInfo).trim();
    }

    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    if (!ua) return 'Unknown device';
    if (ua.includes('android')) return 'Android device';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS device';
    if (ua.includes('windows')) return 'Windows browser';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS browser';
    if (ua.includes('linux')) return 'Linux browser';
    return 'Browser device';
  }

  async register(req, res) {
    try {
      const data = await authService.register({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        file: req.file
      });
      return successResponse(
        res,
        data,
        "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
        201
      );
    } catch (error) {
      console.error("Error registering user:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  async login(req, res) {
    try {
      const data = await authService.login({
        ...req.body,
        device_info: this.resolveDeviceInfo(req),
        ip_address: this.resolveClientIp(req),
        user_agent: req.headers['user-agent'] || null
      });
      return successResponse(res, data, "Đăng nhập thành công");
    } catch (error) {
      console.error("Error logging in:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  async verifyEmail(req, res) {
    try {
      const result = await authService.verifyEmail(req.query.token);
      if (result.alreadyVerified) {
        return successResponse(res, null, "Email đã được xác nhận trước đó");
      }
      return successResponse(res, null, "Email đã được xác nhận thành công");
    } catch (error) {
      console.error("Error verifying email:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  async resendVerificationEmail(req, res) {
    try {
      const result = await authService.resendVerificationEmail(req.body.email);
      if (result.silent) {
        return successResponse(
          res,
          null,
          "Nếu email tồn tại, email xác nhận đã được gửi"
        );
      }

      return successResponse(res, null, "Email xác nhận đã được gửi lại");
    } catch (error) {
      console.error("Error resending verification email:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  async forgotPassword(req, res) {
    try {
      await authService.forgotPassword(req.body.email);

      return successResponse(
        res,
        null,
        "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi"
      );
    } catch (error) {
      console.error("Error in forgot password:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  async resetPassword(req, res) {
    try {
      await authService.resetPassword(req.body);

      return successResponse(res, null, "Đặt lại mật khẩu thành công");
    } catch (error) {
      console.error("Error resetting password:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  async googleCallback(req, res) {
    try {
      const result = await authService.googleCallback(req.user, {
        device_info: this.resolveDeviceInfo(req),
        ip_address: this.resolveClientIp(req),
        user_agent: req.headers['user-agent'] || null
      });
      const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}${result.redirectPath}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error in Google callback:", error);
      return res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/login?error=google_auth_failed`
      );
    }
  }

  async setupPasswordForGoogle(req, res) {
    try {
      const data = await authService.setupPasswordForGoogle({
        ...req.body,
        device_info: this.resolveDeviceInfo(req),
        ip_address: this.resolveClientIp(req),
        user_agent: req.headers['user-agent'] || null
      });

      return successResponse(
        res,
        data,
        "Đặt mật khẩu thành công! Tài khoản đã được tạo và kích hoạt."
      );
    } catch (error) {
      console.error("Error setting up password for Google account:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  async getSessions(req, res) {
    try {
      const data = await authService.getSessions(req.user.id);
      return successResponse(res, data, 'Lấy danh sách phiên thành công');
    } catch (error) {
      console.error('Error getting sessions:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async revokeSession(req, res) {
    try {
      const data = await authService.revokeSession(req.user.id, req.params.id);
      return successResponse(res, data, 'Đã thu hồi phiên');
    } catch (error) {
      console.error('Error revoking session:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async revokeAllSessions(req, res) {
    try {
      const data = await authService.revokeAllSessions(req.user.id);
      return successResponse(res, data, 'Đã thu hồi tất cả phiên');
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }

  async logout(req, res) {
    try {
      const data = await authService.logoutCurrentSession(req.user.id, req.user.session_id);
      return successResponse(res, data, 'Đăng xuất thành công');
    } catch (error) {
      console.error('Error logging out:', error);
      return errorResponse(res, error.message || 'Lỗi server', error.statusCode || 500);
    }
  }
}

module.exports = new AuthController();
