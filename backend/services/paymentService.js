const crypto = require('crypto');
const axios = require('axios');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { createServiceError } = require('./serviceError');
const db = require('../config/database');

class PaymentService {
  isMockMode() {
    return process.env.USE_MOCK_PAYMENT === 'true' || process.env.USE_MOCK_PAYMENT === '1';
  }

  async withTransaction(handler) {
    const connection = await db.promise.getConnection();
    try {
      await connection.beginTransaction();
      const result = await handler(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  canTransitionStatus(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return true;
    if (currentStatus === 'pending' && ['success', 'failed', 'expired'].includes(nextStatus)) {
      return true;
    }
    return false;
  }

  async ensureVipRole(userId, connection) {
    const user = await User.findById(userId, { connection });
    if (!user) {
      throw createServiceError('Không tìm thấy user', 404);
    }

    if (user.role !== 'vip' && user.role !== 'admin') {
      const updated = await User.update(userId, { role: 'vip' }, { connection });
      if (!updated) {
        throw createServiceError('Lỗi nâng cấp tài khoản. Vui lòng thử lại sau.', 500);
      }
      return { ...user, role: 'vip' };
    }

    return user;
  }

  async applyStatusChange(orderId, targetStatus, options = {}) {
    const { connection, momoTransactionId } = options;
    const payment = await Payment.findByOrderId(orderId, { connection, forUpdate: true });
    if (!payment) {
      throw createServiceError('Không tìm thấy giao dịch', 404);
    }

    if (!this.canTransitionStatus(payment.status, targetStatus)) {
      return {
        payment,
        changed: false
      };
    }

    if (payment.status !== targetStatus) {
      await Payment.updateByOrderId(
        orderId,
        {
          status: targetStatus,
          momo_transaction_id: momoTransactionId || payment.momo_transaction_id
        },
        { connection }
      );
      payment.status = targetStatus;
      if (momoTransactionId) {
        payment.momo_transaction_id = momoTransactionId;
      }
      return {
        payment,
        changed: true
      };
    }

    if (targetStatus === 'success' && momoTransactionId && !payment.momo_transaction_id) {
      await Payment.updateByOrderId(
        orderId,
        { momo_transaction_id: momoTransactionId },
        { connection }
      );
      payment.momo_transaction_id = momoTransactionId;
      return {
        payment,
        changed: true
      };
    }

    return {
      payment,
      changed: false
    };
  }

  async createPayment(userId, amount = 50000) {
    const user = await User.findById(userId);
    if (!user) throw createServiceError('User không tồn tại', 404);
    if (user.role === 'vip' || user.role === 'admin') {
      throw createServiceError('Tài khoản của bạn đã là VIP hoặc Admin', 400);
    }

    const orderId = `VIP_${userId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (this.isMockMode()) {
      const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK_PAYMENT_${orderId}`;
      const paymentId = await Payment.create({
        user_id: userId,
        order_id: orderId,
        amount,
        payment_type: 'vip_upgrade',
        qr_code_url: mockQrCodeUrl,
        qr_code_data: mockQrCodeUrl,
        expires_at: expiresAt
      });
      if (!paymentId || !(await Payment.findByOrderId(orderId))) {
        throw createServiceError('Lỗi lưu thông tin thanh toán vào database', 500);
      }
      return {
        payment_id: paymentId,
        order_id: orderId,
        qr_code_url: mockQrCodeUrl,
        pay_url: mockQrCodeUrl,
        amount,
        expires_at: expiresAt,
        message: 'Tạo thanh toán thành công (MOCK MODE). Vui lòng sử dụng nút "Simulate Payment" để test.',
        is_mock: true
      };
    }

    const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
    const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
    const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const requestId = orderId;
    const usernameClean = user.username
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
    const orderInfoRaw = `Upgrade to VIP - ${usernameClean}`.substring(0, 255);
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`;
    const notifyUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/callback`;
    const extraData = '';
    const requestType = 'captureWallet';
    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfoRaw}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');

    let momoResponse;
    try {
      momoResponse = await axios.post(
        MOMO_ENDPOINT,
        {
          partnerCode: MOMO_PARTNER_CODE,
          accessKey: MOMO_ACCESS_KEY,
          requestId,
          amount,
          orderId,
          orderInfo: orderInfoRaw,
          redirectUrl: returnUrl,
          ipnUrl: notifyUrl,
          extraData,
          requestType,
          signature,
          lang: 'vi'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('MoMo API Error:', error.response?.data || error.message);
      throw createServiceError('Lỗi kết nối với MoMo. Vui lòng thử lại sau.', 500);
    }

    if (momoResponse.data.resultCode !== 0) {
      throw createServiceError(momoResponse.data.message || 'Lỗi tạo thanh toán', 400);
    }

    const paymentId = await Payment.create({
      user_id: userId,
      order_id: orderId,
      amount,
      payment_type: 'vip_upgrade',
      qr_code_url: momoResponse.data.qrCodeUrl || '',
      qr_code_data: momoResponse.data.qrCodeUrl || '',
      expires_at: expiresAt
    });
    if (!paymentId || !(await Payment.findByOrderId(orderId))) {
      throw createServiceError('Lỗi lưu thông tin thanh toán vào database', 500);
    }

    return {
      payment_id: paymentId,
      order_id: orderId,
      qr_code_url: momoResponse.data.qrCodeUrl,
      pay_url: momoResponse.data.payUrl,
      amount,
      expires_at: expiresAt,
      message: 'Tạo thanh toán thành công. Vui lòng quét mã QR để thanh toán.'
    };
  }

  async getPayment({ orderId, userId, userRole }) {
    const payment = await Payment.findByOrderId(orderId);
    if (!payment) throw createServiceError('Không tìm thấy giao dịch', 404);
    if (payment.user_id !== userId && userRole !== 'admin') {
      throw createServiceError('Không có quyền truy cập', 403);
    }
    if (payment.status === 'pending' && new Date(payment.expires_at) < new Date()) {
      await Payment.update(payment.id, { status: 'expired' });
      payment.status = 'expired';
    }
    return payment;
  }

  async paymentCallback(body) {
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
      accessKey
    } = body;
    if (!orderId) {
      return { httpStatus: 400, body: { resultCode: -1, message: 'Missing orderId' } };
    }

    const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || '67bI6g8YKMpQCIbtO09odyCIeBgGExH7';
    const rawSignature = `partnerCode=${partnerCode}&accessKey=${accessKey || body.accessKey || ''}&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&resultCode=${resultCode}&message=${message}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData || ''}`;
    const expectedSignature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');
    if (signature !== expectedSignature) {
      console.error('⚠️ Invalid signature from MoMo');
      return { httpStatus: 400, body: { resultCode: -1, message: 'Invalid signature' } };
    }

    const payment = await Payment.findByOrderId(orderId);
    if (!payment) {
      return { httpStatus: 404, body: { resultCode: -1, message: 'Payment not found' } };
    }

    await this.withTransaction(async (connection) => {
      if (resultCode === 0) {
        const result = await this.applyStatusChange(orderId, 'success', {
          connection,
          momoTransactionId: transId
        });
        if (result.payment.status === 'success') {
          await this.ensureVipRole(result.payment.user_id, connection);
        }
      } else {
        await this.applyStatusChange(orderId, 'failed', { connection });
      }
    });

    return { httpStatus: 200, body: { resultCode: 0, message: 'Success' } };
  }

  async queryMoMoPaymentStatus(orderId) {
    try {
      const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
      const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
      const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const MOMO_QUERY_ENDPOINT = process.env.MOMO_QUERY_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/query';
      const requestId = `QUERY_${orderId}_${Date.now()}`;
      const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&orderId=${orderId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${requestId}`;
      const signature = crypto.createHmac('sha256', MOMO_SECRET_KEY).update(rawSignature).digest('hex');
      const response = await axios.post(
        MOMO_QUERY_ENDPOINT,
        {
          partnerCode: MOMO_PARTNER_CODE,
          accessKey: MOMO_ACCESS_KEY,
          requestId,
          orderId,
          signature,
          lang: 'vi'
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Error querying MoMo payment status for ${orderId}:`, error.message);
      return null;
    }
  }

  async checkPaymentStatus({ orderId, userId, forceQuery }) {
    const payment = await Payment.findByOrderId(orderId);
    if (!payment) throw createServiceError('Không tìm thấy giao dịch', 404);
    if (payment.user_id !== userId) throw createServiceError('Không có quyền truy cập', 403);

    if (payment.status === 'pending' && new Date(payment.expires_at) < new Date()) {
      await this.withTransaction(async (connection) => {
        const result = await this.applyStatusChange(orderId, 'expired', { connection });
        payment.status = result.payment.status;
      });
    }

    const paymentAge = payment.created_at ? Date.now() - new Date(payment.created_at).getTime() : 0;
    if (payment.status === 'pending' && (forceQuery === 'true' || forceQuery === true || paymentAge > 30000)) {
      const momoStatus = await this.queryMoMoPaymentStatus(orderId);
      if (momoStatus && momoStatus.resultCode === 0) {
        await this.withTransaction(async (connection) => {
          const result = await this.applyStatusChange(orderId, 'success', {
            connection,
            momoTransactionId: momoStatus.transId || payment.momo_transaction_id
          });
          if (result.payment.status === 'success') {
            await this.ensureVipRole(result.payment.user_id, connection);
          }
          payment.status = result.payment.status;
        });
      } else if (momoStatus && momoStatus.resultCode !== 0) {
        await this.withTransaction(async (connection) => {
          const result = await this.applyStatusChange(orderId, 'failed', { connection });
          payment.status = result.payment.status;
        });
      }
    }

    if (payment.status === 'success') {
      await this.withTransaction(async (connection) => {
        await this.ensureVipRole(payment.user_id, connection);
      });
    }

    const user = payment.status === 'success' ? await User.findById(userId) : null;
    return {
      status: payment.status,
      order_id: payment.order_id,
      user: user
        ? {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        : null
    };
  }

  async getPaymentHistory(userId, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    return Payment.findByUserId(userId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  }

  async manualUpgrade({ orderId, userId }) {
    const result = await this.withTransaction(async (connection) => {
      const payment = await Payment.findByOrderId(orderId, { connection, forUpdate: true });
      if (!payment) throw createServiceError('Không tìm thấy giao dịch', 404);
      if (payment.user_id !== userId) throw createServiceError('Không có quyền truy cập', 403);
      if (payment.status !== 'success') {
        throw createServiceError('Giao dịch chưa được thanh toán thành công', 400);
      }

      const user = await User.findById(userId, { connection });
      if (!user) throw createServiceError('Không tìm thấy user', 404);
      if (user.role === 'vip' || user.role === 'admin') {
        return { user, alreadyUpgraded: true };
      }

      await this.ensureVipRole(userId, connection);
      const updatedUser = await User.findById(userId, { connection });
      return { user: updatedUser, alreadyUpgraded: false };
    });
    const updatedUser = result.user;

    if (result.alreadyUpgraded) {
      const message = updatedUser.role === 'admin' ? 'Tài khoản đã là Admin' : 'Tài khoản đã là VIP';
      return {
        message,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role
        }
      };
    }

    return {
      message: 'Nâng cấp VIP thành công',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      }
    };
  }

  async simulatePaymentSuccess({ orderId, userId }) {
    if (!this.isMockMode()) {
      throw createServiceError('Chức năng này chỉ dùng trong mock mode', 403);
    }

    const user = await this.withTransaction(async (connection) => {
      const payment = await Payment.findByOrderId(orderId, { connection, forUpdate: true });
      if (!payment) throw createServiceError('Không tìm thấy giao dịch', 404);
      if (payment.user_id !== userId) throw createServiceError('Không có quyền truy cập', 403);
      if (payment.status === 'success') throw createServiceError('Giao dịch đã được thanh toán', 400);
      if (!this.canTransitionStatus(payment.status, 'success')) {
        throw createServiceError('Giao dịch không thể chuyển sang thành công', 400);
      }

      await Payment.updateByOrderId(orderId, {
        status: 'success',
        momo_transaction_id: `MOCK_${Date.now()}`
      }, { connection });
      await this.ensureVipRole(payment.user_id, connection);
      return User.findById(userId, { connection });
    });

    return {
      status: 'success',
      order_id: orderId,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      message: 'Thanh toán thành công (Mock Mode)'
    };
  }
}

module.exports = new PaymentService();
