import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Lấy thông tin user từ token (có thể decode hoặc gọi API)
      // Tạm thời lưu token và redirect
      localStorage.setItem('token', token);
      
      // Fetch user info
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            authLogin(token, data.data);
            navigate('/');
          } else {
            navigate('/login?error=google_auth_failed');
          }
        })
        .catch(() => {
          navigate('/login?error=google_auth_failed');
        });
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [searchParams, navigate, authLogin]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>
      Đang xử lý đăng nhập...
    </div>
  );
};

export default GoogleAuthCallback;

