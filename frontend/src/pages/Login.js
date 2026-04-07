import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login, googleLogin } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    // Check for account locked error from query params
    if (searchParams.get('error') === 'account_locked') {
      setError('Tài khoản của bạn đã bị khóa hoặc cấm vĩnh viễn. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
    }
    
    // Check for Google registration success message
    if (searchParams.get('message') === 'google_registration_success') {
      const email = searchParams.get('email');
      setError('');
      alert(`Đăng ký thành công! Vui lòng kiểm tra email ${email} để đặt mật khẩu cho tài khoản.`);
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
    setLoading(true);

    try {
      const response = await login(formData);
      if (response.data.success) {
        authLogin(response.data.data.token, response.data.data.user);
        navigate('/');
      } else {
        setError(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Đăng nhập</h2>
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
              {error.includes('khóa') || error.includes('cấm') ? (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  <p>Email: khanhhungbadong@gmail.com</p>
                  <p>Hotline: 0868686868</p>
                </div>
              ) : null}
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Nhập email của bạn"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <div style={{ 
            margin: '15px 0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
            <span style={{ color: '#666', fontSize: '14px' }}>HOẶC</span>
            <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
          </div>
          
          <button
            type="button"
            onClick={googleLogin}
            style={{
              width: '100%',
              padding: '12px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '16px',
              fontWeight: '500',
              color: '#333',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f5f5f5';
              e.target.style.borderColor = '#ccc';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#fff';
              e.target.style.borderColor = '#ddd';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Đăng nhập với Google
          </button>
        </div>

        <p className="auth-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
        <p className="auth-link" style={{ marginTop: '10px' }}>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

