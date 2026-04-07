import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminGetUsers, adminUpdateUser, adminDeleteUser } from '../services/api';
import Loading from '../components/common/Loading';
import './AdminUsers.css';

const AdminUsers = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState(null);
  const [editingStatusUserId, setEditingStatusUserId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    newPassword: ''
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate]);

  const fetchUsers = async (pageNumber = 1, searchText = search) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminGetUsers({ page: pageNumber, limit: 20, search: searchText });
      if (response.data.success) {
        const payload = response.data.data || {};
        setUsers(payload.data || []);
        setPagination(payload.pagination || { total: 0, totalPages: 1 });
        setPage(pageNumber);
      } else {
        setUsers([]);
        setError(response.data.message || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1, search.trim());
  };

  const handleEdit = (targetUser) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể chỉnh sửa tài khoản của chính mình.');
      return;
    }
    setEditingUser(targetUser);
    setEditFormData({
      username: targetUser.username || '',
      email: targetUser.email || '',
      newPassword: ''
    });
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setShowEditModal(false);
    setEditFormData({
      username: '',
      email: '',
      newPassword: ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.id === user.id) {
      alert('Bạn không thể chỉnh sửa tài khoản của chính mình.');
      return;
    }

    if (!editFormData.username.trim()) {
      alert('Tên người dùng không được để trống');
      return;
    }

    if (!editFormData.email.trim()) {
      alert('Email không được để trống');
      return;
    }

    if (editFormData.newPassword && editFormData.newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setUpdatingUserId(editingUser.id);
      // Cập nhật username, email và mật khẩu mới (nếu có)
      const updateData = {
        username: editFormData.username.trim(),
        email: editFormData.email.trim()
      };
      
      if (editFormData.newPassword.trim()) {
        updateData.newPassword = editFormData.newPassword.trim();
      }
      
      await adminUpdateUser(editingUser.id, updateData);
      await fetchUsers(page);
      setEditingUser(null);
      setShowEditModal(false);
      setEditFormData({
        username: '',
        email: '',
        newPassword: ''
      });
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err.response?.data?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleInlineRoleEdit = (targetUser) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể thay đổi quyền của chính mình.');
      return;
    }
    setEditingRoleUserId(targetUser.id);
  };

  const handleInlineRoleSave = async (targetUser, newRole) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể thay đổi quyền của chính mình.');
      setEditingRoleUserId(null);
      return;
    }

    try {
      setUpdatingUserId(targetUser.id);
      await adminUpdateUser(targetUser.id, { role: newRole });
      await fetchUsers(page);
      setEditingRoleUserId(null);
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Không thể cập nhật vai trò. Vui lòng thử lại.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleInlineRoleCancel = () => {
    setEditingRoleUserId(null);
  };

  const handleInlineStatusEdit = (targetUser) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể thay đổi trạng thái của chính mình.');
      return;
    }
    setEditingStatusUserId(targetUser.id);
  };

  const handleInlineStatusSave = async (targetUser, newStatus) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể thay đổi trạng thái của chính mình.');
      setEditingStatusUserId(null);
      return;
    }

    try {
      setUpdatingUserId(targetUser.id);
      await adminUpdateUser(targetUser.id, { account_status: newStatus });
      await fetchUsers(page);
      setEditingStatusUserId(null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleInlineStatusCancel = () => {
    setEditingStatusUserId(null);
  };

  const handleChangeRole = async (targetUser, newRole) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể thay đổi quyền của chính mình tại đây.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn đổi quyền của "${targetUser.username}" thành "${newRole}"?`)) {
      return;
    }

    try {
      setUpdatingUserId(targetUser.id);
      await adminUpdateUser(targetUser.id, { role: newRole });
      await fetchUsers(page);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Không thể cập nhật quyền. Vui lòng thử lại.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user.id) {
      alert('Bạn không thể xóa tài khoản của chính mình.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa user "${targetUser.username}"?`)) {
      return;
    }

    try {
      setUpdatingUserId(targetUser.id);
      await adminDeleteUser(targetUser.id);
      await fetchUsers(page);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Không thể xóa user. Vui lòng thử lại.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="admin-users-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="page-title">Quản lý tài khoản</h1>
          <form className="admin-users-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-search">
              Tìm kiếm
            </button>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="users-table-section">
          <h2>Danh sách tài khoản</h2>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Avatar</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>
                        <img
                          src={
                            u.avatar
                              ? (u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000${u.avatar}`)
                              : 'https://via.placeholder.com/40?text=U'
                          }
                          alt={u.username}
                          className="user-avatar-small"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40?text=U';
                          }}
                        />
                      </td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        {editingRoleUserId === u.id ? (
                          <div className="inline-edit-wrapper">
                            <select
                              defaultValue={u.role}
                              className="role-select inline-edit-select"
                              onChange={(e) => handleInlineRoleSave(u, e.target.value)}
                              onBlur={handleInlineRoleCancel}
                              autoFocus
                            >
                              <option value="reader">User</option>
                              <option value="vip">VIP</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        ) : (
                          <span 
                            className={`role-badge role-${u.role} clickable-badge`}
                            onClick={() => handleInlineRoleEdit(u)}
                            title="Click để sửa vai trò"
                          >
                            {u.role === 'admin' ? 'Admin' : u.role === 'vip' ? 'VIP' : 'User'}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingStatusUserId === u.id ? (
                          <div className="inline-edit-wrapper">
                            <select
                              defaultValue={u.account_status || 'active'}
                              className="status-select inline-edit-select"
                              onChange={(e) => handleInlineStatusSave(u, e.target.value)}
                              onBlur={handleInlineStatusCancel}
                              autoFocus
                            >
                              <option value="active">Hoạt động</option>
                              <option value="locked">Khóa</option>
                              <option value="banned">Cấm vĩnh viễn</option>
                            </select>
                          </div>
                        ) : (
                          <span 
                            className={`status-badge status-${u.account_status || 'active'} clickable-badge`}
                            onClick={() => handleInlineStatusEdit(u)}
                            title="Click để sửa trạng thái"
                          >
                            {u.account_status === 'active' ? 'Hoạt động' : 
                             u.account_status === 'locked' ? 'Khóa' : 
                             u.account_status === 'banned' ? 'Cấm' : 'Hoạt động'}
                          </span>
                        )}
                      </td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}</td>
                      <td>
                        <div className="action-buttons-table">
                          <button
                            className="btn-edit"
                            disabled={updatingUserId === u.id || editingRoleUserId === u.id || editingStatusUserId === u.id}
                            onClick={() => handleEdit(u)}
                            title="Sửa thông tin tài khoản (tên, email)"
                          >
                            Sửa
                          </button>
                          <button
                            className="btn-delete"
                            disabled={updatingUserId === u.id || editingRoleUserId === u.id || editingStatusUserId === u.id}
                            onClick={() => handleDeleteUser(u)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                      Không có tài khoản nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => fetchUsers(page - 1)}
              >
                Trang trước
              </button>
              <span>
                Trang {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => fetchUsers(page + 1)}
              >
                Trang sau
              </button>
            </div>
          )}
        </div>

        {/* Modal chỉnh sửa thông tin tài khoản */}
        {showEditModal && editingUser && (
          <div className="edit-user-modal-overlay" onClick={handleCancelEdit}>
            <div className="edit-user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="edit-user-modal-header">
                <h2>Chỉnh sửa thông tin tài khoản</h2>
                <button className="btn-close-modal" onClick={handleCancelEdit}>
                  ×
                </button>
              </div>
              
              <div className="edit-user-modal-body">
                {/* Avatar Section */}
                <div className="edit-user-avatar-section">
                  <div className="edit-user-avatar-wrapper">
                    <img 
                      src={
                        editingUser.avatar
                          ? (editingUser.avatar.startsWith('http') 
                            ? editingUser.avatar 
                            : `http://localhost:5000${editingUser.avatar}`)
                          : 'https://via.placeholder.com/150?text=U'
                      } 
                      alt={editingUser.username}
                      className="edit-user-avatar"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150?text=U';
                      }}
                    />
                  </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSaveEdit} className="edit-user-form">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="Nhập email"
                      required
                    />
                    <small>Email có thể thay đổi</small>
                  </div>

                  <div className="form-group">
                    <label>Tên người dùng</label>
                    <input
                      type="text"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                      placeholder="Nhập tên người dùng"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input
                      type="password"
                      value={editFormData.newPassword}
                      onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                      placeholder="Nhập mật khẩu mới (để trống nếu không đổi)"
                      minLength="6"
                    />
                    <small>Để trống nếu không muốn thay đổi mật khẩu</small>
                  </div>

                  <div className="edit-user-modal-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={handleCancelEdit}
                      disabled={updatingUserId === editingUser.id}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn-save"
                      disabled={updatingUserId === editingUser.id}
                    >
                      {updatingUserId === editingUser.id ? 'Đang lưu...' : 'Cập nhật'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;


