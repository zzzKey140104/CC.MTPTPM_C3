import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { googleLogin, resendVerificationEmail } from '../services/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();
      
      if (data.success) {
        // Hiển thị thông báo thành công và hướng dẫn kiểm tra email
        setError('');
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.');
        navigate('/login');
      } else {
        setError(data.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Đăng ký</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Tên người dùng</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Nhập tên người dùng"
            />
          </div>

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
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <div className="form-group">
            <label>Ảnh đại diện (tùy chọn)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="avatar-input"
            />
            {avatarPreview && (
              <div className="avatar-preview">
                <img src={avatarPreview} alt="Avatar preview" />
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
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
            Đăng ký với Google
          </button>
        </div>

        <p className="auth-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

