export const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/200x300?text=No+Image';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const COMIC_STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  HIATUS: 'hiatus'
};

export const COMIC_STATUS_LABELS = {
  [COMIC_STATUS.ONGOING]: 'Đang ra',
  [COMIC_STATUS.COMPLETED]: 'Hoàn thành',
  [COMIC_STATUS.HIATUS]: 'Tạm ngưng'
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20
};

// Color Theme - 4 màu chủ đạo từ ảnh
export const COLORS = {
  // Deep Navy Blue (màu xanh đậm)
  PRIMARY_DEEP: '#2C3E6B',
  PRIMARY_DEEP_LIGHT: '#3A4F7A',
  PRIMARY_DEEP_DARK: '#1E2A4A',
  
  // Slate Blue (màu xanh xám)
  PRIMARY_SLATE: '#6B7A9F',
  PRIMARY_SLATE_LIGHT: '#8A9BB8',
  PRIMARY_SLATE_DARK: '#4F5D7A',
  
  // Creamy Yellow (màu vàng kem)
  ACCENT_CREAM: '#F5E6D3',
  ACCENT_CREAM_LIGHT: '#FDF5E8',
  ACCENT_CREAM_DARK: '#E8D4B8',
  
  // Terracotta Orange (màu cam đất)
  ACCENT_ORANGE: '#D97D54',
  ACCENT_ORANGE_LIGHT: '#E89A7A',
  ACCENT_ORANGE_DARK: '#C2653A',
  
  // Neutral colors
  WHITE: '#FFFFFF',
  BLACK: '#1A1A1A',
  GRAY_LIGHT: '#F5F5F5',
  GRAY_MEDIUM: '#E0E0E0',
  GRAY_DARK: '#666666',
};
