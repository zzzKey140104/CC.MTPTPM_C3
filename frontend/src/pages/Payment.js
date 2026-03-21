import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createPayment, checkPaymentStatus, simulatePaymentSuccess, manualUpgrade } from '../services/api';
import Loading from '../components/common/Loading';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 phút = 900 giây
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isMock, setIsMock] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paymentCreatedAt, setPaymentCreatedAt] = useState(null);
  const [manualUpgrading, setManualUpgrading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user && (user.role === 'vip' || user.role === 'admin')) {
      navigate('/');
      return;
    }

    // Tạo payment khi component mount
    createPaymentRequest();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!paymentData || paymentStatus !== 'pending') return;

    let pollCount = 0;
    // Polling để kiểm tra trạng thái thanh toán mỗi 3 giây
    const interval = setInterval(async () => {
      try {
        pollCount++;
        // Sau 30 giây (10 lần polling), force query từ MoMo
        const forceQuery = pollCount >= 10;
        
        const response = await checkPaymentStatus(paymentData.order_id, forceQuery);
        if (response.data.success) {
          const status = response.data.data.status;
          setPaymentStatus(status);

          // Kiểm tra nếu payment success nhưng user chưa VIP
          if (status === 'success') {
            const userRole = response.data.data.user?.role;
            if (userRole !== 'vip' && userRole !== 'admin') {
              // Payment success nhưng user chưa được upgrade, thử manual upgrade
              console.log('Payment success but user not VIP, attempting manual upgrade...');
              try {
                const upgradeResponse = await manualUpgrade(paymentData.order_id);
                if (upgradeResponse.data.success) {
                  await refreshUser();
                  setTimeout(() => {
                    navigate('/?upgrade=success');
                  }, 2000);
                  clearInterval(interval);
                  return;
                }
              } catch (upgradeErr) {
                console.error('Error in manual upgrade:', upgradeErr);
              }
            } else {
              // Thanh toán thành công và user đã VIP, refresh user và redirect
              await refreshUser();
              setTimeout(() => {
                navigate('/?upgrade=success');
              }, 2000);
              clearInterval(interval);
            }
          } else if (status === 'failed' || status === 'expired') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentData, paymentStatus, refreshUser, navigate]);

  useEffect(() => {
    if (!paymentData || timeLeft <= 0) return;

    // Đếm ngược thời gian
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData, timeLeft]);

  const createPaymentRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await createPayment(50000); // 50,000 VNĐ

      if (response.data.success) {
        setPaymentData(response.data.data);
        setIsMock(response.data.data.is_mock || false);
        const expiresAt = new Date(response.data.data.expires_at);
        const now = new Date();
        const secondsLeft = Math.floor((expiresAt - now) / 1000);
        setTimeLeft(Math.max(0, secondsLeft));
        setPaymentStatus('pending');
        setPaymentCreatedAt(new Date());
      } else {
        setError(response.data.message || 'Lỗi tạo thanh toán');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      setError(err.response?.data?.message || 'Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = async () => {
    if (!paymentData) return;
    
    try {
      setSimulating(true);
      const response = await simulatePaymentSuccess(paymentData.order_id);
      if (response.data.success) {
        // Refresh user và redirect
        await refreshUser();
        setTimeout(() => {
          navigate('/?upgrade=success');
        }, 1000);
      } else {
        setError(response.data.message || 'Lỗi simulate payment');
      }
    } catch (err) {
      console.error('Error simulating payment:', err);
      setError(err.response?.data?.message || 'Lỗi simulate payment');
    } finally {
      setSimulating(false);
    }
  };

  const handleManualUpgrade = async () => {
    if (!paymentData) return;
    
    try {
      setManualUpgrading(true);
      setError(null);
      const response = await manualUpgrade(paymentData.order_id);
      if (response.data.success) {
        // Refresh user và redirect
        await refreshUser();
        setTimeout(() => {
          navigate('/?upgrade=success');
        }, 1000);
      } else {
        setError(response.data.message || 'Lỗi nâng cấp thủ công');
      }
    } catch (err) {
      console.error('Error in manual upgrade:', err);
      setError(err.response?.data?.message || 'Lỗi nâng cấp thủ công');
    } finally {
      setManualUpgrading(false);
    }
  };

  const handleForceCheck = async () => {
    if (!paymentData) return;
    
    try {
      setError(null);
      const response = await checkPaymentStatus(paymentData.order_id, true);
      if (response.data.success) {
        const status = response.data.data.status;
        setPaymentStatus(status);
        
        if (status === 'success') {
          const userRole = response.data.data.user?.role;
          if (userRole !== 'vip' && userRole !== 'admin') {
            // Thử manual upgrade
            await handleManualUpgrade();
          } else {
            await refreshUser();
            setTimeout(() => {
              navigate('/?upgrade=success');
            }, 2000);
          }
        }
      }
    } catch (err) {
      console.error('Error force checking payment:', err);
      setError('Lỗi kiểm tra trạng thái thanh toán');
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error && !paymentData) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-error">
            <h2>❌ Lỗi</h2>
            <p>{error}</p>
            <button onClick={createPaymentRequest} className="btn-retry">
              Thử lại
            </button>
            <button onClick={() => navigate('/')} className="btn-back">
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-container">
          <div className="payment-header">
            <h1>⭐ Nâng cấp tài khoản VIP</h1>
            <p className="payment-subtitle">
              Thanh toán một lần để nâng cấp tài khoản lên VIP và đọc tất cả truyện VIP
            </p>
          </div>

          <div className="payment-content">
            {paymentStatus === 'pending' && timeLeft > 0 && (
              <>
                <div className="payment-info">
                  <div className="info-item">
                    <span className="info-label">Số tiền:</span>
                    <span className="info-value">{paymentData?.amount?.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mã đơn hàng:</span>
                    <span className="info-value">{paymentData?.order_id}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Thời gian còn lại:</span>
                    <span className={`info-value time-left ${timeLeft < 300 ? 'time-warning' : ''}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>

                <div className="payment-action-section">
                  <h3>Thanh toán nâng cấp VIP</h3>
                  {isMock ? (
                    <p className="payment-instruction">
                      Mock Mode: Sử dụng nút bên dưới để simulate thanh toán
                    </p>
                  ) : (
                    <p className="payment-instruction">
                      Click vào nút bên dưới để thanh toán bằng MoMo
                    </p>
                  )}
                  
                  {paymentData?.pay_url && !isMock ? (
                    <div className="pay-url-section">
                      <a 
                        href={paymentData.pay_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-pay-url"
                      >
                        💳 Thanh toán bằng MoMo
                      </a>
                    </div>
                  ) : (
                    <div className="pay-url-section">
                      <button 
                        onClick={createPaymentRequest}
                        className="btn-pay-url btn-pay-url-disabled"
                        disabled
                      >
                        ⏳ Đang tạo link thanh toán...
                      </button>
                    </div>
                  )}
                </div>

                {isMock && (
                  <div className="mock-payment-section">
                    <button 
                      onClick={handleSimulatePayment}
                      disabled={simulating}
                      className="btn-simulate"
                    >
                      {simulating ? 'Đang xử lý...' : '✅ Simulate Payment Success'}
                    </button>
                    <p className="mock-note">
                      ⚠️ Mock Mode: Nút này chỉ dùng để test. Trong production sẽ không có nút này.
                    </p>
                  </div>
                )}

                <div className="payment-status">
                  <div className="status-indicator status-pending">
                    <span className="status-dot"></span>
                    Đang chờ thanh toán...
                  </div>
                  {paymentCreatedAt && Date.now() - paymentCreatedAt.getTime() > 30000 && (
                    <div className="payment-help-section">
                      <p className="help-text">
                        ⚠️ Đã thanh toán nhưng chưa thấy cập nhật? 
                      </p>
                      <button 
                        onClick={handleForceCheck}
                        className="btn-force-check"
                      >
                        🔄 Kiểm tra lại từ MoMo
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {paymentStatus === 'success' && (
              <div className="payment-success">
                <div className="success-icon">✅</div>
                <h2>Thanh toán thành công!</h2>
                <p>Tài khoản của bạn đã được nâng cấp lên VIP.</p>
                {user && user.role !== 'vip' && user.role !== 'admin' && (
                  <div className="manual-upgrade-section">
                    <p className="warning-text">
                      ⚠️ Thanh toán thành công nhưng tài khoản chưa được nâng cấp. Vui lòng click nút bên dưới.
                    </p>
                    <button 
                      onClick={handleManualUpgrade}
                      disabled={manualUpgrading}
                      className="btn-manual-upgrade"
                    >
                      {manualUpgrading ? 'Đang xử lý...' : '🔧 Nâng cấp thủ công'}
                    </button>
                  </div>
                )}
                {user && (user.role === 'vip' || user.role === 'admin') && (
                  <p>Đang chuyển hướng...</p>
                )}
              </div>
            )}

            {(paymentStatus === 'expired' || timeLeft <= 0) && (
              <div className="payment-expired">
                <div className="expired-icon">⏰</div>
                <h2>Mã QR đã hết hạn</h2>
                <p>Mã QR thanh toán đã hết hạn. Vui lòng tạo mã mới.</p>
                <button onClick={createPaymentRequest} className="btn-create-new">
                  Tạo mã QR mới
                </button>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="payment-failed">
                <div className="failed-icon">❌</div>
                <h2>Thanh toán thất bại</h2>
                <p>Giao dịch thanh toán không thành công. Vui lòng thử lại.</p>
                <button onClick={createPaymentRequest} className="btn-retry">
                  Thử lại
                </button>
              </div>
            )}

            <div className="payment-actions">
              <button onClick={() => navigate('/')} className="btn-cancel">
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;

