import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './Auth.css';

const GoogleRegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '20px',
            color: '#4CAF50'
          }}>
            ✅
          </div>
          <h2>Email xác nhận đã được gửi!</h2>
          
          <div style={{
            background: '#e3f2fd',
            borderLeft: '4px solid #2196F3',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '5px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              📧 Vui lòng kiểm tra email của bạn:
            </p>
            <p style={{ 
              margin: '0', 
              fontSize: '18px', 
              color: '#1976D2',
              wordBreak: 'break-all'
            }}>
              {email || 'Email của bạn'}
            </p>
          </div>

          <div style={{
            background: '#fff3cd',
            borderLeft: '4px solid #ffc107',
            padding: '15px',
            margin: '20px 0',
            borderRadius: '5px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              📝 Bước tiếp theo:
            </p>
            <ol style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Mở email xác nhận đăng ký</li>
              <li>Click vào link "Đặt Mật khẩu"</li>
              <li>Nhập mật khẩu cho tài khoản của bạn</li>
              <li>Hoàn tất đăng ký và bắt đầu đọc truyện!</li>
            </ol>
          </div>

          <p style={{ color: '#666', marginTop: '20px' }}>
            <strong>Lưu ý:</strong> Nếu không thấy email, vui lòng kiểm tra thư mục <strong>Spam</strong> hoặc <strong>Junk</strong>.
          </p>

          <div style={{ marginTop: '30px' }}>
            <Link to="/login" className="btn btn-primary" style={{ 
              display: 'inline-block',
              textDecoration: 'none',
              padding: '12px 30px'
            }}>
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleRegistrationSuccess;

