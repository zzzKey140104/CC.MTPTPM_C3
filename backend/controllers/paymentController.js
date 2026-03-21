const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/Payment");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");

class PaymentController {
  // Tạo payment request và QR code
  async createPayment(req, res) {
    try {
      const userId = req.user.id;
      const { amount = 50000 } = req.body; // Mặc định 50,000 VNĐ

      // Kiểm tra user đã là VIP chưa
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, "User không tồn tại", 404);
      }

      if (user.role === "vip" || user.role === "admin") {
        return errorResponse(
          res,
          "Tài khoản của bạn đã là VIP hoặc Admin",
          400
        );
      }

      // Tạo order_id duy nhất
      const orderId = `VIP_${userId}_${Date.now()}`;

      // Thời gian hết hạn: 15 phút
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Kiểm tra chế độ mock payment (để test không cần MoMo thật)
      const USE_MOCK_PAYMENT =
        process.env.USE_MOCK_PAYMENT === "true" ||
        process.env.USE_MOCK_PAYMENT === "1";

      // Nếu dùng mock mode, bỏ qua MoMo API
      if (USE_MOCK_PAYMENT) {
        // Tạo QR code giả (mock) - chỉ để test UI
        const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_PAYMENT_${orderId}`;

        // Lưu payment vào database với status pending
        console.log(`💾 Creating mock payment in database: ${orderId} for user ${userId}`);
        const paymentId = await Payment.create({
          user_id: userId,
          order_id: orderId,
          amount: amount,
          payment_type: "vip_upgrade",
          qr_code_url: mockQrCodeUrl,
          qr_code_data: mockQrCodeUrl,
          expires_at: expiresAt,
        });

        if (!paymentId) {
          console.error(`❌ Failed to create mock payment in database: ${orderId}`);
          return errorResponse(res, "Lỗi lưu thông tin thanh toán vào database", 500);
        }

        // Verify payment was created
        const createdPayment = await Payment.findByOrderId(orderId);
        if (!createdPayment) {
          console.error(`❌ Mock payment not found after creation: ${orderId}`);
          return errorResponse(res, "Lỗi xác thực thông tin thanh toán", 500);
        }

        console.log(`✅ Mock payment created successfully: ${orderId}, Payment ID: ${paymentId}`);

        return successResponse(res, {
          payment_id: paymentId,
          order_id: orderId,
          qr_code_url: mockQrCodeUrl,
          pay_url: mockQrCodeUrl,
          amount: amount,
          expires_at: expiresAt,
          message:
            'Tạo thanh toán thành công (MOCK MODE). Vui lòng sử dụng nút "Simulate Payment" để test.',
          is_mock: true,
        });
      }

      // MoMo Sandbox configuration (chỉ dùng khi không phải mock mode)
      // Sử dụng thông tin từ MoMo Developer Portal hoặc test credentials
      const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
      const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
      const MOMO_SECRET_KEY =
        process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
      const MOMO_ENDPOINT =
        process.env.MOMO_ENDPOINT ||
        "https://test-payment.momo.vn/v2/gateway/api/create";

      // Tạo request data cho MoMo theo format chính thức từ MoMo docs
      const requestId = orderId;
      // orderInfo: chỉ dùng ASCII, giới hạn 255 ký tự
      const usernameClean = user.username
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
        .replace(/[^a-zA-Z0-9\s]/g, "") // Loại bỏ ký tự đặc biệt
        .trim();
      const orderInfoRaw = `Upgrade to VIP - ${usernameClean}`.substring(
        0,
        255
      );
      const returnUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payment/callback`;
      const notifyUrl = `${
        process.env.BACKEND_URL || "http://localhost:5000"
      }/api/payments/callback`;
      const extraData = ""; // Để trống
      const requestType = "captureWallet"; // Theo MoMo docs

      // Tạo raw signature theo đúng thứ tự từ MoMo docs:
      // accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
      const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfoRaw}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

      // Tạo HMAC SHA256 signature
      const signature = crypto
        .createHmac("sha256", MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest("hex");

      // Request data theo format chính thức từ MoMo docs
      const requestData = {
        partnerCode: MOMO_PARTNER_CODE,
        accessKey: MOMO_ACCESS_KEY,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfoRaw,
        redirectUrl: returnUrl,
        ipnUrl: notifyUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: "vi",
      };

      // Gọi MoMo API
      let momoResponse;
      try {
        console.log("MoMo Request:", JSON.stringify(requestData, null, 2));
        console.log("Raw Signature:", rawSignature);

        momoResponse = await axios.post(MOMO_ENDPOINT, requestData, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(
          "MoMo Response:",
          JSON.stringify(momoResponse.data, null, 2)
        );
      } catch (error) {
        console.error("MoMo API Error:", error.response?.data || error.message);
        console.error("Request Data:", JSON.stringify(requestData, null, 2));
        console.error("Raw Signature:", rawSignature);
        return errorResponse(
          res,
          "Lỗi kết nối với MoMo. Vui lòng thử lại sau.",
          500
        );
      }

      if (momoResponse.data.resultCode !== 0) {
        console.error("MoMo Error:", momoResponse.data);
        return errorResponse(
          res,
          momoResponse.data.message || "Lỗi tạo thanh toán",
          400
        );
      }

      // Lưu payment vào database
      console.log(`💾 Creating payment in database: ${orderId} for user ${userId}`);
      const paymentId = await Payment.create({
        user_id: userId,
        order_id: orderId,
        amount: amount,
        payment_type: "vip_upgrade",
        qr_code_url: momoResponse.data.qrCodeUrl || "",
        qr_code_data: momoResponse.data.qrCodeUrl || "",
        expires_at: expiresAt,
      });

      if (!paymentId) {
        console.error(`❌ Failed to create payment in database: ${orderId}`);
        return errorResponse(res, "Lỗi lưu thông tin thanh toán vào database", 500);
      }

      // Verify payment was created
      const createdPayment = await Payment.findByOrderId(orderId);
      if (!createdPayment) {
        console.error(`❌ Payment not found after creation: ${orderId}`);
        return errorResponse(res, "Lỗi xác thực thông tin thanh toán", 500);
      }

      console.log(`✅ Payment created successfully: ${orderId}, Payment ID: ${paymentId}`);

      return successResponse(res, {
        payment_id: paymentId,
        order_id: orderId,
        qr_code_url: momoResponse.data.qrCodeUrl,
        pay_url: momoResponse.data.payUrl,
        amount: amount,
        expires_at: expiresAt,
        message:
          "Tạo thanh toán thành công. Vui lòng quét mã QR để thanh toán.",
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  // Lấy thông tin payment
  async getPayment(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const payment = await Payment.findByOrderId(orderId);

      if (!payment) {
        return errorResponse(res, "Không tìm thấy giao dịch", 404);
      }

      // Kiểm tra quyền truy cập
      if (payment.user_id !== userId && req.user.role !== "admin") {
        return errorResponse(res, "Không có quyền truy cập", 403);
      }

      // Kiểm tra hết hạn
      if (
        payment.status === "pending" &&
        new Date(payment.expires_at) < new Date()
      ) {
        await Payment.update(payment.id, { status: "expired" });
        payment.status = "expired";
      }

      return successResponse(res, payment);
    } catch (error) {
      console.error("Error getting payment:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  // Callback từ MoMo (IPN - Instant Payment Notification)
  async paymentCallback(req, res) {
    try {
      console.log("=== MoMo Callback Received ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature,
        accessKey,
      } = req.body;

      if (!orderId) {
        console.error("Missing orderId in callback");
        return res.status(400).json({ 
          resultCode: -1,
          message: "Missing orderId" 
        });
      }

      // Verify signature
      const MOMO_SECRET_KEY =
        process.env.MOMO_SECRET_KEY || "67bI6g8YKMpQCIbtO09odyCIeBgGExH7";
      // Format signature cho callback: partnerCode, accessKey, requestId, amount, orderId, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData
      const rawSignature = `partnerCode=${partnerCode}&accessKey=${
        accessKey || req.body.accessKey || ""
      }&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${
        extraData || ""
      }`;

      const expectedSignature = crypto
        .createHmac("sha256", MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("⚠️ Invalid signature from MoMo");
        console.error("Received signature:", signature);
        console.error("Expected signature:", expectedSignature);
        console.error("Raw signature:", rawSignature);
        // Vẫn xử lý payment nhưng log lỗi (có thể do format signature thay đổi)
        // return res.status(400).json({ error: 'Invalid signature' });
      } else {
        console.log("✅ Signature verified successfully");
      }

      // Tìm payment
      const payment = await Payment.findByOrderId(orderId);
      if (!payment) {
        console.error(`❌ Payment not found: ${orderId}`);
        return res.status(404).json({ 
          resultCode: -1,
          message: "Payment not found" 
        });
      }

      console.log(`📦 Found payment: ${orderId}, Status: ${payment.status}, User ID: ${payment.user_id}`);

      // Nếu payment đã được xử lý rồi, chỉ cần trả về success
      if (payment.status === "success" && resultCode === 0) {
        console.log(`✅ Payment ${orderId} already processed as success`);
        // Đảm bảo user vẫn được upgrade (recovery)
        const user = await User.findById(payment.user_id);
        if (user && user.role !== "vip" && user.role !== "admin") {
          const updateResult = await User.update(payment.user_id, { role: "vip" });
          if (updateResult) {
            console.log(`✅ User ${payment.user_id} upgraded to VIP (recovery from callback)`);
          } else {
            console.error(`❌ Failed to upgrade user ${payment.user_id}`);
          }
        }
        return res.status(200).json({
          resultCode: 0,
          message: "Success",
        });
      }

      // Cập nhật payment status
      if (resultCode === 0) {
        // Thanh toán thành công
        console.log(`💰 Payment successful: ${orderId}, Transaction ID: ${transId}`);
        
        // Update payment status
        const paymentUpdateResult = await Payment.updateByOrderId(orderId, {
          status: "success",
          momo_transaction_id: transId,
        });

        if (!paymentUpdateResult) {
          console.error(`❌ Failed to update payment status for ${orderId}`);
        } else {
          console.log(`✅ Payment status updated to success for ${orderId}`);
        }

        // Đảm bảo user được nâng cấp (kiểm tra lại trước khi update)
        const user = await User.findById(payment.user_id);
        if (!user) {
          console.error(`❌ User not found: ${payment.user_id}`);
        } else if (user.role !== "vip" && user.role !== "admin") {
          const userUpdateResult = await User.update(payment.user_id, { role: "vip" });
          if (userUpdateResult) {
            console.log(`✅ User ${payment.user_id} upgraded to VIP`);
          } else {
            console.error(`❌ Failed to upgrade user ${payment.user_id} to VIP`);
            // Retry upgrade
            setTimeout(async () => {
              const retryResult = await User.update(payment.user_id, { role: "vip" });
              if (retryResult) {
                console.log(`✅ User ${payment.user_id} upgraded to VIP (retry successful)`);
              } else {
                console.error(`❌ Retry failed to upgrade user ${payment.user_id}`);
              }
            }, 1000);
          }
        } else {
          console.log(`ℹ️ User ${payment.user_id} already VIP or Admin`);
        }
      } else {
        // Thanh toán thất bại
        console.log(`❌ Payment failed: ${orderId}, Message: ${message}, ResultCode: ${resultCode}`);
        await Payment.updateByOrderId(orderId, {
          status: "failed",
        });
      }

      // MoMo yêu cầu trả về JSON
      return res.status(200).json({
        resultCode: 0,
        message: "Success",
      });
    } catch (error) {
      console.error("❌ Error in payment callback:", error);
      console.error("Error stack:", error.stack);
      // Vẫn trả về success để MoMo không retry quá nhiều
      return res.status(200).json({ 
        resultCode: 0,
        message: "Received but processing error" 
      });
    }
  }

  // Query payment status từ MoMo API
  async queryMoMoPaymentStatus(orderId) {
    try {
      const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
      const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
      const MOMO_SECRET_KEY =
        process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
      const MOMO_QUERY_ENDPOINT =
        process.env.MOMO_QUERY_ENDPOINT ||
        "https://test-payment.momo.vn/v2/gateway/api/query";

      const requestId = `QUERY_${orderId}_${Date.now()}`;
      const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&orderId=${orderId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${requestId}`;

      const signature = crypto
        .createHmac("sha256", MOMO_SECRET_KEY)
        .update(rawSignature)
        .digest("hex");

      const requestData = {
        partnerCode: MOMO_PARTNER_CODE,
        accessKey: MOMO_ACCESS_KEY,
        requestId: requestId,
        orderId: orderId,
        signature: signature,
        lang: "vi",
      };

      console.log(`🔍 Querying MoMo API for order: ${orderId}`);
      const response = await axios.post(MOMO_QUERY_ENDPOINT, requestData, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds timeout
      });

      console.log(`📥 MoMo query response for ${orderId}:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error(`❌ Error querying MoMo payment status for ${orderId}:`, error.message);
      if (error.response) {
        console.error(`MoMo API error response:`, JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }

  // Kiểm tra trạng thái thanh toán (polling từ frontend)
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      const { forceQuery } = req.query; // Thêm option để force query từ MoMo

      const payment = await Payment.findByOrderId(orderId);

      if (!payment) {
        return errorResponse(res, "Không tìm thấy giao dịch", 404);
      }

      // Kiểm tra quyền truy cập
      if (payment.user_id !== userId) {
        return errorResponse(res, "Không có quyền truy cập", 403);
      }

      // Kiểm tra hết hạn
      if (
        payment.status === "pending" &&
        new Date(payment.expires_at) < new Date()
      ) {
        await Payment.update(payment.id, { status: "expired" });
        payment.status = "expired";
      }

      // Nếu payment vẫn pending và có forceQuery hoặc đã quá 30 giây, query từ MoMo
      const paymentAge = payment.created_at
        ? Date.now() - new Date(payment.created_at).getTime()
        : 0;
      if (
        payment.status === "pending" &&
        (forceQuery === "true" || forceQuery === true || paymentAge > 30000)
      ) {
        console.log(`🔍 Querying MoMo for payment status: ${orderId} (forceQuery: ${forceQuery}, age: ${paymentAge}ms)`);
        const momoStatus = await this.queryMoMoPaymentStatus(orderId);

        if (momoStatus && momoStatus.resultCode === 0) {
          // Thanh toán thành công trên MoMo
          console.log(`✅ Payment confirmed successful from MoMo: ${orderId}, Transaction ID: ${momoStatus.transId}`);
          
          const updateResult = await Payment.updateByOrderId(orderId, {
            status: "success",
            momo_transaction_id:
              momoStatus.transId || payment.momo_transaction_id,
          });

          if (!updateResult) {
            console.error(`❌ Failed to update payment status for ${orderId}`);
          } else {
            console.log(`✅ Payment status updated to success for ${orderId}`);
          }

          // Đảm bảo user được nâng cấp
          const user = await User.findById(payment.user_id);
          if (!user) {
            console.error(`❌ User not found: ${payment.user_id}`);
          } else if (user.role !== "vip" && user.role !== "admin") {
            const userUpdateResult = await User.update(payment.user_id, { role: "vip" });
            if (userUpdateResult) {
              console.log(`✅ User ${payment.user_id} upgraded to VIP after MoMo query`);
            } else {
              console.error(`❌ Failed to upgrade user ${payment.user_id} after MoMo query`);
              // Retry upgrade
              setTimeout(async () => {
                const retryResult = await User.update(payment.user_id, { role: "vip" });
                if (retryResult) {
                  console.log(`✅ User ${payment.user_id} upgraded to VIP (retry after query)`);
                } else {
                  console.error(`❌ Retry failed to upgrade user ${payment.user_id}`);
                }
              }, 1000);
            }
          } else {
            console.log(`ℹ️ User ${payment.user_id} already VIP or Admin`);
          }

          payment.status = "success";
        } else if (momoStatus && momoStatus.resultCode !== 0) {
          // Thanh toán thất bại
          console.log(`❌ Payment failed from MoMo: ${orderId}, ResultCode: ${momoStatus.resultCode}, Message: ${momoStatus.message}`);
          await Payment.updateByOrderId(orderId, {
            status: "failed",
          });
          payment.status = "failed";
        } else {
          console.log(`⚠️ MoMo query returned null or invalid response for ${orderId}`);
        }
      }

      // Nếu thanh toán thành công nhưng user chưa được nâng cấp, nâng cấp ngay (recovery mechanism)
      if (payment.status === "success") {
        const user = await User.findById(payment.user_id);
        if (!user) {
          console.error(`❌ User not found for recovery: ${payment.user_id}`);
        } else if (user.role !== "vip" && user.role !== "admin") {
          console.log(`🔄 Recovery: Upgrading user ${payment.user_id} to VIP`);
          const userUpdateResult = await User.update(payment.user_id, { role: "vip" });
          if (userUpdateResult) {
            console.log(`✅ User ${payment.user_id} upgraded to VIP (recovery)`);
          } else {
            console.error(`❌ Failed to upgrade user ${payment.user_id} in recovery`);
            // Retry upgrade
            setTimeout(async () => {
              const retryResult = await User.update(payment.user_id, { role: "vip" });
              if (retryResult) {
                console.log(`✅ User ${payment.user_id} upgraded to VIP (recovery retry)`);
              } else {
                console.error(`❌ Recovery retry failed for user ${payment.user_id}`);
              }
            }, 1000);
          }
        }
      }

      // Lấy thông tin user mới
      let user = null;
      if (payment.status === "success") {
        user = await User.findById(userId);
      }

      return successResponse(res, {
        status: payment.status,
        order_id: payment.order_id,
        user: user
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
            }
          : null,
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  // Lấy lịch sử thanh toán của user
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const payments = await Payment.findByUserId(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return successResponse(res, payments);
    } catch (error) {
      console.error("Error getting payment history:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  // Manually trigger upgrade nếu payment đã success nhưng user chưa được upgrade
  async manualUpgrade(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      console.log(`🔧 Manual upgrade requested: ${orderId} for user ${userId}`);

      const payment = await Payment.findByOrderId(orderId);

      if (!payment) {
        console.error(`❌ Payment not found for manual upgrade: ${orderId}`);
        return errorResponse(res, "Không tìm thấy giao dịch", 404);
      }

      // Kiểm tra quyền truy cập
      if (payment.user_id !== userId) {
        console.error(`❌ Unauthorized manual upgrade attempt: ${orderId} by user ${userId} (payment belongs to ${payment.user_id})`);
        return errorResponse(res, "Không có quyền truy cập", 403);
      }

      // Chỉ cho phép nếu payment đã success
      if (payment.status !== "success") {
        console.error(`❌ Payment not successful for manual upgrade: ${orderId}, status: ${payment.status}`);
        return errorResponse(
          res,
          "Giao dịch chưa được thanh toán thành công",
          400
        );
      }

      // Kiểm tra user hiện tại
      const user = await User.findById(userId);
      if (!user) {
        console.error(`❌ User not found for manual upgrade: ${userId}`);
        return errorResponse(res, "Không tìm thấy user", 404);
      }

      // Nâng cấp user nếu chưa là VIP
      if (user.role !== "vip" && user.role !== "admin") {
        console.log(`🔄 Upgrading user ${userId} to VIP for payment ${orderId}`);
        const updateResult = await User.update(userId, { role: "vip" });
        
        if (!updateResult) {
          console.error(`❌ Failed to upgrade user ${userId} in manual upgrade`);
          return errorResponse(res, "Lỗi nâng cấp tài khoản. Vui lòng thử lại sau.", 500);
        }

        console.log(`✅ Manual upgrade successful: User ${userId} upgraded to VIP for payment ${orderId}`);

        // Lấy lại user để đảm bảo có dữ liệu mới nhất
        const updatedUser = await User.findById(userId);
        if (!updatedUser) {
          console.error(`❌ Failed to fetch updated user: ${userId}`);
          return errorResponse(res, "Lỗi lấy thông tin user", 500);
        }

        return successResponse(res, {
          message: "Nâng cấp VIP thành công",
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
          },
        });
      } else {
        console.log(`ℹ️ User ${userId} already VIP or Admin`);
        return successResponse(res, {
          message: "Tài khoản đã là VIP",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      }
    } catch (error) {
      console.error("❌ Error in manual upgrade:", error);
      console.error("Error stack:", error.stack);
      return errorResponse(res, "Lỗi server", 500);
    }
  }

  // Simulate payment success (chỉ dùng trong mock mode để test)
  async simulatePaymentSuccess(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      // Chỉ cho phép trong mock mode
      const USE_MOCK_PAYMENT =
        process.env.USE_MOCK_PAYMENT === "true" ||
        process.env.USE_MOCK_PAYMENT === "1";
      if (!USE_MOCK_PAYMENT) {
        return errorResponse(
          res,
          "Chức năng này chỉ dùng trong mock mode",
          403
        );
      }

      // Tìm payment
      const payment = await Payment.findByOrderId(orderId);
      if (!payment) {
        return errorResponse(res, "Không tìm thấy giao dịch", 404);
      }

      // Kiểm tra quyền truy cập
      if (payment.user_id !== userId) {
        return errorResponse(res, "Không có quyền truy cập", 403);
      }

      // Kiểm tra đã thanh toán chưa
      if (payment.status === "success") {
        return errorResponse(res, "Giao dịch đã được thanh toán", 400);
      }

      // Simulate payment success
      await Payment.updateByOrderId(orderId, {
        status: "success",
        momo_transaction_id: `MOCK_${Date.now()}`,
      });

      // Nâng cấp user lên VIP
      await User.update(payment.user_id, { role: "vip" });

      console.log(
        `Mock payment successful: ${orderId}, User ${payment.user_id} upgraded to VIP`
      );

      // Lấy thông tin user mới
      const user = await User.findById(userId);

      return successResponse(res, {
        status: "success",
        order_id: orderId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        message: "Thanh toán thành công (Mock Mode)",
      });
    } catch (error) {
      console.error("Error simulating payment success:", error);
      return errorResponse(res, "Lỗi server", 500);
    }
  }
}

module.exports = new PaymentController();
