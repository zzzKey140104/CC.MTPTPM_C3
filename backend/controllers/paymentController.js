const { successResponse, errorResponse } = require("../utils/response");
const paymentService = require('../services/paymentService');

class PaymentController {
  // Tạo payment request và QR code
  async createPayment(req, res) {
    try {
      const data = await paymentService.createPayment(req.user.id, req.body.amount || 50000);
      return successResponse(res, data);
    } catch (error) {
      console.error("Error creating payment:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  // Lấy thông tin payment
  async getPayment(req, res) {
    try {
      const payment = await paymentService.getPayment({
        orderId: req.params.orderId,
        userId: req.user.id,
        userRole: req.user.role
      });
      return successResponse(res, payment);
    } catch (error) {
      console.error("Error getting payment:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  // Callback từ MoMo (IPN - Instant Payment Notification)
  async paymentCallback(req, res) {
    try {
      const result = await paymentService.paymentCallback(req.body);
      return res.status(result.httpStatus).json(result.body);
    } catch (error) {
      console.error("❌ Error in payment callback:", error);
      return res.status(200).json({ 
        resultCode: 0,
        message: "Received but processing error" 
      });
    }
  }

  // Kiểm tra trạng thái thanh toán (polling từ frontend)
  async checkPaymentStatus(req, res) {
    try {
      const data = await paymentService.checkPaymentStatus({
        orderId: req.params.orderId,
        userId: req.user.id,
        forceQuery: req.query.forceQuery
      });
      return successResponse(res, data);
    } catch (error) {
      console.error("Error checking payment status:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  // Lấy lịch sử thanh toán của user
  async getPaymentHistory(req, res) {
    try {
      const payments = await paymentService.getPaymentHistory(req.user.id, req.query);

      return successResponse(res, payments);
    } catch (error) {
      console.error("Error getting payment history:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  // Manually trigger upgrade nếu payment đã success nhưng user chưa được upgrade
  async manualUpgrade(req, res) {
    try {
      const data = await paymentService.manualUpgrade({
        orderId: req.params.orderId,
        userId: req.user.id
      });
      return successResponse(res, data);
    } catch (error) {
      console.error("❌ Error in manual upgrade:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }

  // Simulate payment success (chỉ dùng trong mock mode để test)
  async simulatePaymentSuccess(req, res) {
    try {
      const data = await paymentService.simulatePaymentSuccess({
        orderId: req.params.orderId,
        userId: req.user.id
      });
      return successResponse(res, data);
    } catch (error) {
      console.error("Error simulating payment success:", error);
      return errorResponse(res, error.message || "Lỗi server", error.statusCode || 500);
    }
  }
}

module.exports = new PaymentController();
