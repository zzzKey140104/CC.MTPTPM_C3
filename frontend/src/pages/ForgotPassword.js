import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      if (response.data.success) {
        setMessage('Nếu email tồn tại, link đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
      } else {
        setError(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Quên Mật khẩu</h2>
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
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi Link Đặt lại Mật khẩu'}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

