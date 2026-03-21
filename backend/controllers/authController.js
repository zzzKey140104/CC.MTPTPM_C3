const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const emailService = require("../utils/emailService");
const { successResponse, errorResponse } = require("../utils/response");

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return errorResponse(res, "Vui lòng điền đầy đủ thông tin", 400);
      }

      // Kiểm tra email đã tồn tại
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return errorResponse(res, "Email đã được sử dụng", 400);
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");

      // Lấy avatar URL nếu có file upload
      let avatar = null;
      if (req.file) {
        avatar = `/uploads/avatars/${req.file.filename}`;
      }

      // Tạo user mới
      const userId = await User.create({
        username,
        email,
        password: hashedPassword,
        avatar,
        email_verification_token: emailVerificationToken,
        email_verified: false,
      });

      // Gửi email xác nhận
      await emailService.sendVerificationEmail(
        email,
        emailVerificationToken,
        username
      );

      const newUser = await User.findById(userId);
      return successResponse(
        res,
        {
          id: userId,
          username,
          email,
          avatar: newUser?.avatar,
          role: newUser?.role || "reader",
        },
        "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
        201
      );
    } catch (error) {
      console.error("Error registering user:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, "Vui lòng điền đầy đủ thông tin", 400);
      }

      // Tìm user
      const user = await User.findByEmail(email);
      if (!user) {
        return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
      }

      // Kiểm tra account_status
      if (
        user.account_status === "locked" ||
        user.account_status === "banned"
      ) {
        return errorResponse(
          res,
          "Tài khoản của bạn đã bị khóa hoặc cấm vĩnh viễn. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
          403
        );
      }

      // Kiểm tra mật khẩu (chỉ nếu user không đăng nhập bằng Google)
      if (user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return errorResponse(res, "Email hoặc mật khẩu không đúng", 401);
        }
      } else {
        return errorResponse(
          res,
          "Tài khoản này được đăng nhập bằng Google. Vui lòng sử dụng Google để đăng nhập.",
          401
        );
      }

      // Kiểm tra email đã được xác nhận chưa (nếu không phải Google account)
      if (!user.google_id && !user.email_verified) {
        return errorResponse(
          res,
          "Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư của bạn.",
          403
        );
      }

      // Validate JWT_SECRET
      if (!process.env.JWT_SECRET) {
        console.error("❌ Lỗi: JWT_SECRET không được cấu hình trong file .env");
        return errorResponse(res, "Lỗi cấu hình server", 500);
      }

      // Tạo JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return successResponse(
        res,
        {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || "reader",
            avatar: user.avatar,
            account_status: user.account_status || "active",
          },
        },
        "Đăng nhập thành công"
      );
    } catch (error) {
      console.error("Error logging in:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return errorResponse(res, "Token không hợp lệ", 400);
      }

      const user = await User.findByVerificationToken(token);
      if (!user) {
        return errorResponse(res, "Token không hợp lệ hoặc đã hết hạn", 400);
      }

      if (user.email_verified) {
        return successResponse(res, null, "Email đã được xác nhận trước đó");
      }

      await User.verifyEmail(user.id);

      return successResponse(res, null, "Email đã được xác nhận thành công");
    } catch (error) {
      console.error("Error verifying email:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return errorResponse(res, "Vui lòng nhập email", 400);
      }

      const user = await User.findByEmail(email);
      if (!user) {
        // Không tiết lộ email có tồn tại hay không
        return successResponse(
          res,
          null,
          "Nếu email tồn tại, email xác nhận đã được gửi"
        );
      }

      if (user.email_verified) {
        return errorResponse(res, "Email đã được xác nhận", 400);
      }

      // Tạo token mới
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");
      await User.update(user.id, {
        email_verification_token: emailVerificationToken,
      });

      await emailService.sendVerificationEmail(
        user.email,
        emailVerificationToken,
        user.username
      );

      return successResponse(res, null, "Email xác nhận đã được gửi lại");
    } catch (error) {
      console.error("Error resending verification email:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return errorResponse(res, "Vui lòng nhập email", 400);
      }

      const user = await User.findByEmail(email);
      if (!user) {
        // Không tiết lộ email có tồn tại hay không
        return successResponse(
          res,
          null,
          "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi"
        );
      }

      // Tạo reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 3600000); // 1 giờ

      await User.setPasswordResetToken(user.id, resetToken, resetExpires);
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username
      );

      return successResponse(
        res,
        null,
        "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi"
      );
    } catch (error) {
      console.error("Error in forgot password:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return errorResponse(res, "Vui lòng điền đầy đủ thông tin", 400);
      }

      if (password.length < 6) {
        return errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự", 400);
      }

      const user = await User.findByPasswordResetToken(token);
      if (!user) {
        return errorResponse(res, "Token không hợp lệ hoặc đã hết hạn", 400);
      }

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.update(user.id, { password: hashedPassword });
      await User.clearPasswordResetToken(user.id);

      return successResponse(res, null, "Đặt lại mật khẩu thành công");
    } catch (error) {
      console.error("Error resetting password:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  async googleCallback(req, res) {
    try {
      // Passport sẽ gắn user vào req.user sau khi xác thực
      const googleUser = req.user;

      if (!googleUser) {
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/login?error=google_auth_failed`
        );
      }

      // Nếu user cần đặt mật khẩu (đăng ký mới bằng Google - CHƯA tạo user)
      if (googleUser.needsPasswordSetup) {
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/google-registration-success?email=${encodeURIComponent(
            googleUser.email
          )}`
        );
      }

      // User đã tồn tại, đăng nhập bình thường
      // Tạo JWT token
      const token = jwt.sign(
        { id: googleUser.id, email: googleUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Redirect về frontend với token
      const redirectUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/google/callback?token=${token}`;
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
      const { token, password } = req.body;

      if (!token || !password) {
        return errorResponse(res, "Vui lòng điền đầy đủ thông tin", 400);
      }

      if (password.length < 6) {
        return errorResponse(res, "Mật khẩu phải có ít nhất 6 ký tự", 400);
      }

      // Decode JWT token chứa thông tin Google
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        return errorResponse(res, "Token không hợp lệ hoặc đã hết hạn", 400);
      }

      // Kiểm tra token có phải registration token không
      if (decoded.type !== "google_registration") {
        return errorResponse(res, "Token không hợp lệ", 400);
      }

      // Kiểm tra email đã được sử dụng chưa
      const emailExists = await User.emailExists(decoded.email);
      if (emailExists) {
        return errorResponse(
          res,
          "Email đã được sử dụng. Vui lòng đăng nhập.",
          400
        );
      }

      // Kiểm tra Google ID đã được sử dụng chưa
      const googleIdExists = await User.findByGoogleId(decoded.google_id);
      if (googleIdExists) {
        return errorResponse(
          res,
          "Tài khoản Google này đã được đăng ký. Vui lòng đăng nhập.",
          400
        );
      }

      // Hash mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // TẠO USER MỚI trong database (lần đầu tiên)
      const userId = await User.create({
        username: decoded.username,
        email: decoded.email,
        password: hashedPassword,
        avatar: decoded.avatar,
        google_id: decoded.google_id,
        email_verified: true, // Google email đã được xác nhận
      });

      const newUser = await User.findById(userId);

      // Tạo JWT token để đăng nhập tự động
      const jwtToken = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return successResponse(
        res,
        {
          token: jwtToken,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role || "reader",
            avatar: newUser.avatar,
            account_status: newUser.account_status || "active",
          },
        },
        "Đặt mật khẩu thành công! Tài khoản đã được tạo và kích hoạt."
      );
    } catch (error) {
      console.error("Error setting up password for Google account:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }
}

module.exports = new AuthController();
