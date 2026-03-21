const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// Tạo payment request (yêu cầu authentication)
router.post('/create', authenticateToken, paymentController.createPayment.bind(paymentController));

// Simulate payment success (chỉ dùng trong mock mode để test)
router.post('/simulate-success/:orderId', authenticateToken, paymentController.simulatePaymentSuccess.bind(paymentController));

// Lấy thông tin payment (yêu cầu authentication)
router.get('/:orderId', authenticateToken, paymentController.getPayment.bind(paymentController));

// Kiểm tra trạng thái thanh toán (yêu cầu authentication)
router.get('/status/:orderId', authenticateToken, paymentController.checkPaymentStatus.bind(paymentController));

// Nâng cấp thủ công nếu payment đã success nhưng user chưa được upgrade (yêu cầu authentication)
router.post('/manual-upgrade/:orderId', authenticateToken, paymentController.manualUpgrade.bind(paymentController));

// Lấy lịch sử thanh toán (yêu cầu authentication)
router.get('/history/list', authenticateToken, paymentController.getPaymentHistory.bind(paymentController));

// Callback từ MoMo (không cần authentication, nhưng cần verify signature)
router.post('/callback', paymentController.paymentCallback.bind(paymentController));

module.exports = router;

