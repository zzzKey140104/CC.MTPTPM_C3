import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getNotificationCount, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/api';
import { API_BASE_URL } from '../../constants';
import './Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotificationCount();
      fetchNotifications();
      // Refresh count every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCount();
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications, showUserMenu]);

  const fetchNotificationCount = async () => {
    try {
      const response = await getNotificationCount();
      if (response.data.success) {
        const count = response.data.data.count || 0;
        setNotificationCount(count > 99 ? 99 : count);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications({ limit: 20 });
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setNotificationCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    // Navigate to comic or chapter
    if (notification.type === 'new_chapter' && notification.chapter_id) {
      navigate(`/chapter/${notification.chapter_id}`);
    } else {
      navigate(`/comic/${notification.comic_id}`);
    }
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setNotificationCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo" aria-label="Trang chủ ReaCom">
            <div className="logo-inner">
              <img
                src="/logo.jpg"
                alt="ReaCom logo"
                className="logo-image"
              />
              <div className="logo-text-group">
                <span className="logo-name">ReaCom</span>
              </div>
            </div>
          </Link>

          <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? 'Chuyển sang sáng' : 'Chuyển sang tối'}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm kiếm truyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">🔍</button>
          </form>

          {isAuthenticated && user ? (
            <div className="user-menu">
              {/* VIP/ADMIN Label */}
              {user.role === 'vip' && (
                <span className="role-badge role-badge-vip">VIP</span>
              )}
              {user.role === 'admin' && (
                <span className="role-badge role-badge-admin">ADMIN</span>
              )}
              <div className="notification-wrapper" ref={notificationRef}>
                <button 
                  className="notification-btn" 
                  title="Thông báo"
                  onClick={toggleNotifications}
                >
                  🔔
                  {notificationCount > 0 && (
                    <span className="notification-badge">{notificationCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Thông báo</h3>
                      {notificationCount > 0 && (
                        <button 
                          className="mark-all-read-btn"
                          onClick={handleMarkAllAsRead}
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>
                    <div className="notification-list">
                      {loading ? (
                        <div className="notification-loading">Đang tải...</div>
                      ) : notifications.length === 0 ? (
                        <div className="notification-empty">Không có thông báo</div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-cover">
                              <img 
                                src={notification.cover_image 
                                  ? (notification.cover_image.startsWith('http') 
                                    ? notification.cover_image 
                                    : `${API_BASE_URL.replace('/api', '')}${notification.cover_image}`)
                                  : 'https://via.placeholder.com/60x80?text=No+Image'} 
                                alt={notification.comic_title}
                              />
                            </div>
                            <div className="notification-content">
                              <div className="notification-title">{notification.title}</div>
                              <div className="notification-message">{notification.message}</div>
                              <div className="notification-time">
                                {new Date(notification.created_at).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            {!notification.is_read && <div className="unread-dot"></div>}
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="notification-footer">
                        <Link to="/favorites" onClick={() => setShowNotifications(false)}>
                          Xem tất cả
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="user-dropdown" ref={userMenuRef}>
                <button 
                  className="avatar-link" 
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                >
                  <img 
                    src={user?.avatar 
                      ? (user.avatar.startsWith('http') 
                        ? user.avatar 
                        : `http://localhost:5000${user.avatar}`)
                      : 'https://via.placeholder.com/40?text=U'} 
                    alt={user?.username}
                    className="avatar"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/40?text=U';
                    }}
                  />
                </button>
                {showUserMenu && (
                  <div className="dropdown-menu">
                    {user?.role === 'admin' && (
                      <>
                        <Link 
                          to="/admin/comics" 
                          className="dropdown-item" 
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowNotifications(false);
                          }}
                        >
                          Quản lý truyện
                        </Link>
                        <Link 
                          to="/admin/users" 
                          className="dropdown-item" 
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowNotifications(false);
                          }}
                        >
                          Quản lý tài khoản
                        </Link>
                      </>
                    )}
                    {user?.role === 'reader' && (
                      <Link 
                        to="/payment/upgrade" 
                        className="dropdown-item dropdown-item-upgrade" 
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowNotifications(false);
                        }}
                      >
                        ⭐ Nâng cấp VIP
                      </Link>
                    )}
                    <Link 
                      to="/profile" 
                      className="dropdown-item" 
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowNotifications(false);
                      }}
                    >
                      Hồ sơ
                    </Link>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }} 
                      className="dropdown-item"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">Đăng nhập</Link>
              <Link to="/register" className="btn-register">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
