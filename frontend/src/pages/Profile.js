import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile } from '../services/api';
import Loading from '../components/common/Loading';
import './Profile.css';

const Profile = () => {
  const { user: authUser, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setFormData({
          username: userData.username || '',
          password: '',
          newPassword: '',
          confirmPassword: ''
        });
        if (userData.avatar) {
          const avatarUrl = userData.avatar.startsWith('http') 
            ? userData.avatar 
            : `http://localhost:5000${userData.avatar}`;
          setAvatarPreview(avatarUrl);
        } else {
          setAvatarPreview(null);
        }
      }
    } catch (err) {
      setError('Không thể tải thông tin. Vui lòng thử lại sau.');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

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
    setSuccess('');

    // Kiểm tra mật khẩu mới nếu có thay đổi
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }
      if (!formData.password) {
        setError('Vui lòng nhập mật khẩu cũ để thay đổi mật khẩu');
        return;
      }
    }

    setUpdating(true);

    try {
      const formDataToSend = new FormData();
      if (formData.username !== user.username) {
        formDataToSend.append('username', formData.username);
      }
      if (formData.password && formData.newPassword) {
        formDataToSend.append('password', formData.password);
        formDataToSend.append('newPassword', formData.newPassword);
      }
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }

      const response = await updateProfile(formDataToSend);
      
      if (response.data.success) {
        setSuccess('Cập nhật thành công!');
      const updatedUser = response.data.data;
      setUser(updatedUser);
      
      // Cập nhật avatar preview
      if (updatedUser.avatar) {
        const avatarUrl = updatedUser.avatar.startsWith('http') 
          ? updatedUser.avatar 
          : `http://localhost:5000${updatedUser.avatar}`;
        setAvatarPreview(avatarUrl);
      }
      
      // Cập nhật AuthContext
      login(authUser.token, {
        ...authUser,
        username: updatedUser.username,
        avatar: updatedUser.avatar
      });

        // Reset form
        setFormData({
          username: updatedUser.username,
          password: '',
          newPassword: '',
          confirmPassword: ''
        });
        setAvatar(null);
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <div className="error-message">Không tìm thấy thông tin người dùng</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title">Hồ sơ của tôi</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-container">
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <img 
                src={avatarPreview || (user.avatar 
                  ? (user.avatar.startsWith('http') 
                    ? user.avatar 
                    : `http://localhost:5000${user.avatar}`)
                  : 'https://via.placeholder.com/150?text=U')} 
                alt={user.username}
                className="profile-avatar"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150?text=U';
                }}
              />
              <label htmlFor="avatar-upload" className="avatar-upload-btn">
                📷 Thay đổi ảnh
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="disabled-input"
              />
              <small>Email không thể thay đổi</small>
            </div>

            <div className="form-group">
              <label>Tên người dùng</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Nhập tên người dùng"
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu cũ (chỉ cần nhập nếu muốn đổi mật khẩu)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu cũ"
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới (để trống nếu không đổi)"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={updating}>
              {updating ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

