const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../utils/emailService');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Tìm user theo Google ID
        let user = await User.findByGoogleId(profile.id);

        if (user) {
          // User đã tồn tại với Google ID này
          return done(null, user);
        }

        // Kiểm tra xem email đã được sử dụng chưa
        const existingUser = await User.findByEmail(profile.emails[0].value);
        
        if (existingUser) {
          // Nếu email đã tồn tại, đăng nhập bình thường
          // Nếu chưa có google_id, cập nhật
          if (!existingUser.google_id) {
            await User.update(existingUser.id, {
              google_id: profile.id
            });
          }
          const updatedUser = await User.findById(existingUser.id);
          return done(null, updatedUser);
        }

        // CHƯA TẠO USER - Chỉ tạo token chứa thông tin Google
        const jwt = require('jsonwebtoken');
        const username = profile.displayName || profile.name.givenName || 'User';
        const email = profile.emails[0].value;
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        
        // Tạo JWT token chứa thông tin Google (hết hạn sau 24 giờ)
        const registrationToken = jwt.sign(
          {
            type: 'google_registration',
            google_id: profile.id,
            email: email,
            username: username,
            avatar: avatar
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        // Gửi email xác nhận đăng ký với link đặt mật khẩu (bất đồng bộ)
        console.log(`📧 Sending Google registration confirmation email to: ${email}`);
        emailService.sendGoogleRegistrationEmail(email, registrationToken, username)
          .then(result => {
            if (result.success) {
              console.log(`✅ Google registration email sent successfully to ${email}`);
            } else {
              console.warn(`⚠️  Registration email not sent (development mode or SMTP not configured)`);
            }
          })
          .catch(err => {
            console.error('❌ Error sending Google registration email:', err.message);
          });
        
        // Trả về thông tin để redirect về trang thông báo (CHƯA tạo user)
        return done(null, { 
          needsPasswordSetup: true, 
          registrationToken: registrationToken,
          email: email 
        });
      } catch (error) {
        console.error('Error in Google OAuth strategy:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

