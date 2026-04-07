const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

// Regular auth routes
router.post('/register', upload.single('avatar'), authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Email verification
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/resend-verification', authController.resendVerificationEmail.bind(authController));

// Password reset
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Setup password for Google account
router.post('/setup-password', authController.setupPasswordForGoogle.bind(authController));

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback.bind(authController)
);

router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/sessions', authenticateToken, authController.getSessions.bind(authController));
router.delete('/sessions/:id', authenticateToken, authController.revokeSession.bind(authController));
router.delete('/sessions', authenticateToken, authController.revokeAllSessions.bind(authController));

module.exports = router;

