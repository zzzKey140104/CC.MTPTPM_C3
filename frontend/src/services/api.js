import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors - auto logout if account is locked/banned
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is about account being locked or banned
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || '';
      if (errorMessage.includes('khóa') || errorMessage.includes('cấm') || 
          errorMessage.includes('locked') || errorMessage.includes('banned')) {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?error=account_locked';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Comics API
export const getComics = (params = {}) => {
  return api.get('/comics', { params });
};

export const getComicsWithFilters = (params = {}) => {
  return api.get('/comics', { params });
};

export const getComicById = (id) => {
  return api.get(`/comics/${id}`);
};

export const incrementComicViews = (id) => {
  return api.post(`/comics/${id}/views`);
};

export const getComicsByCategory = (categoryId, params = {}) => {
  return api.get(`/comics/category/${categoryId}`, { params });
};

export const getLatestComics = (limit = 10) => {
  return api.get('/comics/latest/updates', { params: { limit } });
};

export const getPopularComics = (limit = 10) => {
  return api.get('/comics/popular/list', { params: { limit } });
};

// Chapters API
export const getChapterById = (id) => {
  return api.get(`/chapters/${id}`);
};

export const incrementChapterViews = (id) => {
  return api.post(`/chapters/${id}/views`);
};

export const getChaptersByComicId = (comicId) => {
  return api.get(`/chapters/comic/${comicId}`);
};

// Auth API
export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const login = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const verifyEmail = (token) => {
  return api.get('/auth/verify-email', { params: { token } });
};

export const resendVerificationEmail = (email) => {
  return api.post('/auth/resend-verification', { email });
};

export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (token, password) => {
  return api.post('/auth/reset-password', { token, password });
};

export const setupPasswordForGoogle = (token, password) => {
  return api.post('/auth/setup-password', { token, password });
};

export const googleLogin = () => {
  // Redirect to backend Google OAuth endpoint
  window.location.href = `${API_BASE_URL}/auth/google`;
};

// Categories API
export const getCategories = () => {
  return api.get('/categories');
};

export const getCategoryById = (id) => {
  return api.get(`/categories/${id}`);
};

// Countries API
export const getCountries = () => {
  return api.get('/countries');
};

// Favorites API
export const getFavorites = () => {
  return api.get('/favorites');
};

export const toggleFavorite = (comicId) => {
  return api.post('/favorites/toggle', { comicId });
};

export const checkFavorite = (comicId) => {
  return api.get(`/favorites/check/${comicId}`);
};

export const getFavoriteCount = () => {
  return api.get('/favorites/count');
};

// Notifications API
export const getNotifications = (params = {}) => {
  return api.get('/notifications', { params });
};

export const getNotificationCount = () => {
  return api.get('/notifications/count');
};

export const markNotificationAsRead = (id) => {
  return api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
  return api.put('/notifications/read-all');
};

// Likes API
export const toggleLike = (comicId) => {
  return api.post('/likes/toggle', { comicId });
};

export const checkLike = (comicId) => {
  return api.get(`/likes/check/${comicId}`);
};

// History API
export const getReadingHistory = (limit = 50) => {
  return api.get('/history', { params: { limit } });
};

export const getReadingHistoryByComic = (comicId) => {
  return api.get(`/history/comic/${comicId}`);
};

export const addReadingHistory = (comicId, chapterId) => {
  return api.post('/history', { comicId, chapterId });
};

export const deleteReadingHistory = (comicId) => {
  return api.delete(`/history/comic/${comicId}`);
};

export const deleteAllReadingHistory = () => {
  return api.delete('/history');
};

// Profile API
export const getProfile = () => {
  return api.get('/users/profile/me');
};

export const updateProfile = (formData) => {
  return api.put('/users/profile/me', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Admin - Users management
export const adminGetUsers = (params = {}) => {
  return api.get('/admin/users', { params });
};

export const adminUpdateUser = (id, data) => {
  return api.put(`/admin/users/${id}`, data);
};

export const adminDeleteUser = (id) => {
  return api.delete(`/admin/users/${id}`);
};

// Comments API
export const getCommentsByComicId = (comicId, params = {}) => {
  return api.get(`/comments/comic/${comicId}`, { params });
};

export const getCommentsByChapterId = (chapterId, params = {}) => {
  return api.get(`/comments/chapter/${chapterId}`, { params });
};

export const createComment = (data) => {
  return api.post('/comments', data);
};

export const toggleCommentLike = (commentId) => {
  return api.post(`/comments/${commentId}/like`);
};

export const checkCommentLike = (commentId) => {
  return api.get(`/comments/${commentId}/like/check`);
};

export const deleteComment = (commentId) => {
  return api.delete(`/comments/${commentId}`);
};

// AI API
export const summarizeComic = (comicId) => {
  return api.post(`/ai/comics/${comicId}/summarize`);
};

export const summarizeChapter = (chapterId) => {
  return api.post(`/ai/chapters/${chapterId}/summarize`);
};

export const aiChat = (data) => {
  return api.post('/ai/chat', data);
};

// Payment API
export const createPayment = (amount) => {
  return api.post('/payments/create', { amount });
};

export const getPayment = (orderId) => {
  return api.get(`/payments/${orderId}`);
};

export const checkPaymentStatus = (orderId, forceQuery = false) => {
  return api.get(`/payments/status/${orderId}`, { 
    params: { forceQuery: forceQuery ? 'true' : 'false' } 
  });
};

export const manualUpgrade = (orderId) => {
  return api.post(`/payments/manual-upgrade/${orderId}`);
};

export const getPaymentHistory = (params = {}) => {
  return api.get('/payments/history/list', { params });
};

export const simulatePaymentSuccess = (orderId) => {
  return api.post(`/payments/simulate-success/${orderId}`);
};

export default api;

