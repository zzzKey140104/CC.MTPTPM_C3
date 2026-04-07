const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Tạo transporter với cấu hình từ environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  SMTP không được cấu hình. Email sẽ không được gửi.');
        console.log('📧 Email sẽ được gửi đến:', to);
        console.log('📧 Tiêu đề:', subject);
        return { success: true, message: 'Email service not configured (development mode)' };
      }

      const mailOptions = {
        from: `"Truyện GG" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email đã được gửi:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Lỗi gửi email:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  }

  async sendVerificationEmail(email, token, username) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Xác nhận Email</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Truyện GG!</p>
            <p>Vui lòng click vào nút bên dưới để xác nhận địa chỉ email của bạn:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Xác nhận Email</a>
            </div>
            <p>Hoặc copy và dán link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #0066cc;">${verificationUrl}</p>
            <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ.</p>
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>© 2024 Truyện GG. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      email,
      'Xác nhận địa chỉ email - Truyện GG',
      html
    );
  }

  async sendPasswordResetEmail(email, token, username) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #ff9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Đặt lại Mật khẩu</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Click vào nút bên dưới để đặt lại mật khẩu:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại Mật khẩu</a>
            </div>
            <p>Hoặc copy và dán link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
            <div class="warning">
              <p><strong>⚠️ Lưu ý:</strong></p>
              <ul>
                <li>Link này sẽ hết hạn sau 1 giờ.</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</li>
                <li>Mật khẩu của bạn sẽ không thay đổi nếu bạn không click vào link trên.</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Truyện GG. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      email,
      'Đặt lại mật khẩu - Truyện GG',
      html
    );
  }

  async sendNewChapterNotification(email, username, comicTitle, chapterNumber, chapterTitle, comicSlug, chapterId) {
    const chapterUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chapter/${chapterId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .comic-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Chương Mới Đã Được Đăng!</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Truyện bạn đang theo dõi vừa có chương mới!</p>
            <div class="comic-info">
              <h2 style="margin-top: 0; color: #2196F3;">${comicTitle}</h2>
              <p><strong>Chương ${chapterNumber}</strong>${chapterTitle ? `: ${chapterTitle}` : ''}</p>
            </div>
            <div style="text-align: center;">
              <a href="${chapterUrl}" class="button">Đọc Ngay</a>
            </div>
            <p>Hoặc copy và dán link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #0066cc;">${chapterUrl}</p>
            <p>Chúc bạn đọc truyện vui vẻ! 📖</p>
          </div>
          <div class="footer">
            <p>© 2024 Truyện GG. Tất cả quyền được bảo lưu.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/favorites" style="color: #2196F3;">Quản lý theo dõi</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      email,
      `Chương mới: ${comicTitle} - Chương ${chapterNumber}`,
      html
    );
  }

  async sendWelcomeEmail(email, username, isGoogleAccount = false) {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng đến với Truyện GG!</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Cảm ơn bạn đã tham gia cộng đồng Truyện GG!</p>
            ${isGoogleAccount ? `
            <div class="info-box">
              <p><strong>📧 Email của bạn đã được xác nhận</strong></p>
              <p>Vì bạn đăng ký bằng Google, email của bạn đã được xác minh tự động. Bạn có thể sử dụng tất cả các tính năng ngay lập tức!</p>
            </div>
            ` : `
            <p>Vui lòng kiểm tra email để xác nhận tài khoản của bạn trước khi sử dụng đầy đủ các tính năng.</p>
            `}
            <p>Với tài khoản của bạn, bạn có thể:</p>
            <ul>
              <li>📚 Đọc truyện không giới hạn</li>
              <li>⭐ Theo dõi truyện yêu thích</li>
              <li>💬 Bình luận và tương tác với cộng đồng</li>
              <li>📖 Lưu lịch sử đọc truyện</li>
              <li>🔔 Nhận thông báo khi có chương mới</li>
            </ul>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Bắt đầu đọc truyện</a>
            </div>
            <p>Chúc bạn có những giây phút đọc truyện thú vị! 📖✨</p>
          </div>
          <div class="footer">
            <p>© 2024 Truyện GG. Tất cả quyền được bảo lưu.</p>
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      email,
      'Chào mừng đến với Truyện GG! 🎉',
      html
    );
  }

  async sendGoogleRegistrationEmail(email, token, username) {
    const setupPasswordUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4285F4; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .info-box { background: #e3f2fd; border-left: 4px solid #4285F4; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Xác nhận đăng ký tài khoản</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${username}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Truyện GG bằng Google!</p>
            <div class="info-box">
              <p><strong>📝 Bước tiếp theo:</strong></p>
              <p>Để hoàn tất đăng ký, vui lòng đặt mật khẩu cho tài khoản của bạn. Mật khẩu này sẽ được sử dụng khi bạn đăng nhập bằng email và mật khẩu.</p>
            </div>
            <p>Click vào nút bên dưới để đặt mật khẩu:</p>
            <div style="text-align: center;">
              <a href="${setupPasswordUrl}" class="button">Đặt Mật khẩu</a>
            </div>
            <p>Hoặc copy và dán link sau vào trình duyệt:</p>
            <p style="word-break: break-all; color: #0066cc;">${setupPasswordUrl}</p>
            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Link này sẽ hết hạn sau 24 giờ</li>
              <li>Sau khi đặt mật khẩu, bạn có thể đăng nhập bằng email/mật khẩu hoặc tiếp tục dùng Google</li>
              <li>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2024 Truyện GG. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      email,
      'Xác nhận đăng ký tài khoản - Truyện GG',
      html
    );
  }
}

module.exports = new EmailService();

