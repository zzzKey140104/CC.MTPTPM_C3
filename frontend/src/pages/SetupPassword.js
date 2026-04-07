import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { setupPasswordForGoogle } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Token không hợp lệ');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setError('Token không hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const response = await setupPasswordForGoogle(token, formData.password);
      if (response.data.success) {
        setMessage('Đặt mật khẩu thành công! Tài khoản đã được tạo và kích hoạt.');
        
        // Tự động đăng nhập
        if (response.data.data.token && response.data.data.user) {
          authLogin(response.data.data.token, response.data.data.user);
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        setError(response.data.message || 'Đặt mật khẩu thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Đặt Mật khẩu cho Tài khoản</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Chào mừng bạn đến với Truyện GG!<br />
          Vui lòng đặt mật khẩu để hoàn tất đăng ký và tạo tài khoản.
        </p>
        <div style={{
          background: '#e3f2fd',
          borderLeft: '4px solid #2196F3',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>💡 Lưu ý:</strong> Sau khi đặt mật khẩu, tài khoản của bạn sẽ được tạo và bạn có thể đăng nhập bằng email/mật khẩu hoặc tiếp tục sử dụng Google.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message" style={{
              padding: '15px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '5px',
              color: '#c33',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          {message && (
            <div className="success-message" style={{
              padding: '15px',
              background: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '5px',
              color: '#155724',
              marginBottom: '20px'
            }}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu mới"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu mới"
              minLength="6"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đặt Mật khẩu và Kích hoạt Tài khoản'}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default SetupPassword;

