import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import './Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token không hợp lệ');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Email đã được xác nhận thành công!');
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Xác nhận email thất bại');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Xác nhận email thất bại. Token có thể đã hết hạn.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Xác nhận Email</h2>
        
        {status === 'loading' && (
          <div className="info-message">
            <p>Đang xác nhận email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-message" style={{
            padding: '15px',
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '5px',
            color: '#155724',
            marginBottom: '20px'
          }}>
            <p>{message}</p>
            <Link to="/login" style={{ color: '#155724', textDecoration: 'underline' }}>
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="error-message" style={{
            padding: '15px',
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
            color: '#721c24',
            marginBottom: '20px'
          }}>
            <p>{message}</p>
            <div style={{ marginTop: '15px' }}>
              <Link to="/login" style={{ color: '#721c24', textDecoration: 'underline', marginRight: '15px' }}>
                Đăng nhập
              </Link>
              <Link to="/register" style={{ color: '#721c24', textDecoration: 'underline' }}>
                Đăng ký lại
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

