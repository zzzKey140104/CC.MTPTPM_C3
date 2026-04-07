import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getProfile,
  updateProfile,
  getSessions,
  revokeSession,
  revokeAllSessions,
  getAIUsageDaily,
  getAIUsageSummary
} from '../services/api';
import Loading from '../components/common/Loading';
import './Profile.css';

const Profile = () => {
  const { user: authUser, token, login, isAuthenticated } = useAuth();
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
  const [sessions, setSessions] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageDaily, setUsageDaily] = useState([]);
  const [usageSummary, setUsageSummary] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
    loadSessionAndUsageData();
  }, [isAuthenticated, navigate]);

  const loadSessionAndUsageData = async () => {
    try {
      setSessionLoading(true);
      setUsageLoading(true);
      const [sessionsResponse, usageDailyResponse, usageSummaryResponse] = await Promise.all([
        getSessions(),
        getAIUsageDaily(),
        getAIUsageSummary()
      ]);
      if (sessionsResponse.data?.success) {
        setSessions(sessionsResponse.data.data || []);
      }
      if (usageDailyResponse.data?.success) {
        setUsageDaily(usageDailyResponse.data.data || []);
      }
      if (usageSummaryResponse.data?.success) {
        setUsageSummary(usageSummaryResponse.data.data || null);
      }
    } catch (err) {
      console.error('Error loading session/usage data:', err);
    } finally {
      setSessionLoading(false);
      setUsageLoading(false);
    }
  };

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
      login(token, {
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

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thu hồi phiên');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllSessions();
      setSessions((prev) => prev.map((session) => ({ ...session, is_revoked: 1 })));
      setSuccess('Đã thu hồi tất cả phiên đăng nhập');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thu hồi tất cả phiên');
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

        <div className="profile-container sessions-container">
          <div className="sessions-header">
            <h2>Thiết bị đăng nhập</h2>
            <button className="btn btn-danger" onClick={handleRevokeAllSessions} type="button">
              Thu hồi tất cả phiên
            </button>
          </div>
          {sessionLoading ? (
            <p>Đang tải danh sách phiên...</p>
          ) : sessions.length === 0 ? (
            <p>Không có phiên đăng nhập nào.</p>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-item">
                  <div>
                    <p><strong>Thiết bị:</strong> {session.device_info || 'Unknown device'}</p>
                    <p><strong>IP:</strong> {session.ip_address || 'Unknown IP'}</p>
                    <p><strong>Đăng nhập lúc:</strong> {new Date(session.created_at).toLocaleString('vi-VN')}</p>
                    <p><strong>Hết hạn:</strong> {new Date(session.expires_at).toLocaleString('vi-VN')}</p>
                    <p><strong>Trạng thái:</strong> {session.is_revoked ? 'Đã thu hồi' : 'Đang hoạt động'}</p>
                  </div>
                  {!session.is_revoked && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      Thu hồi
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-container usage-container">
          <h2>Sử dụng AI</h2>
          {usageLoading ? (
            <p>Đang tải thống kê AI...</p>
          ) : (
            <>
              <div className="usage-summary">
                <p><strong>Tổng chat:</strong> {usageSummary?.total_chat_count || 0}</p>
                <p><strong>Tổng tóm tắt:</strong> {usageSummary?.total_summary_count || 0}</p>
                <p><strong>Tổng input tokens:</strong> {usageSummary?.total_input_tokens || 0}</p>
                <p><strong>Tổng output tokens:</strong> {usageSummary?.total_output_tokens || 0}</p>
                <p><strong>Chi phí ước lượng:</strong> {Number(usageSummary?.total_estimated_cost || 0).toFixed(6)} USD</p>
              </div>
              <div className="usage-list">
                {usageDaily.length === 0 ? (
                  <p>Chưa có dữ liệu sử dụng AI.</p>
                ) : (
                  usageDaily.map((row) => (
                    <div key={row.date} className="usage-item">
                      <p><strong>Ngày:</strong> {row.date}</p>
                      <p><strong>Chat:</strong> {row.chat_count} | <strong>Tóm tắt:</strong> {row.summary_count}</p>
                      <p><strong>Tokens:</strong> in {row.estimated_input_tokens} / out {row.estimated_output_tokens}</p>
                      <p><strong>Cost:</strong> {Number(row.estimated_cost || 0).toFixed(6)} USD</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

