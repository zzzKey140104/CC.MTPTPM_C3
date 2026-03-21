import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCategories, getCountries } from '../services/api';
import { getImageUrl } from '../utils/helpers';
import Loading from '../components/common/Loading';
import './AdminComics.css';

const AdminComics = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [comics, setComics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingComic, setEditingComic] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    status: 'ongoing',
    access_status: 'open',
    country_id: '',
    category_ids: []
  });
  const [coverImage, setCoverImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedComic, setSelectedComic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [closedVipChapters, setClosedVipChapters] = useState([]);
  const [closedVipComics, setClosedVipComics] = useState([]);
  const [loadingClosedVipComics, setLoadingClosedVipComics] = useState(false);
  const [allVipChapters, setAllVipChapters] = useState([]);
  const [loadingVipChapters, setLoadingVipChapters] = useState(false);
  const [totalComics, setTotalComics] = useState(0);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterFormData, setChapterFormData] = useState({
    comic_id: '',
    chapter_number: '',
    title: '',
    status: 'open'
  });
  const [chapterImages, setChapterImages] = useState([]);
  const [submittingChapter, setSubmittingChapter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [crawlForm, setCrawlForm] = useState({
    comic_url: '',
    max_chapters: 20
  });
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlResult, setCrawlResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const [comicsRes, categoriesRes, countriesRes] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/comics?page=1&limit=50${searchParam}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.json()),
        getCategories(),
        getCountries()
      ]);

      // Fetch closed and VIP comics
      fetchClosedVipComics();
      fetchAllVipChapters();

      if (comicsRes.success && comicsRes.data) {
        // Kiểm tra nếu data là object có property data
        const comicsArray = Array.isArray(comicsRes.data) 
          ? comicsRes.data 
          : (comicsRes.data.data || []);
        setComics(comicsArray);
        // Lấy tổng số truyện từ pagination
        if (comicsRes.data.pagination) {
          setTotalComics(comicsRes.data.pagination.total || comicsArray.length);
        } else {
          setTotalComics(comicsArray.length);
        }
      } else {
        setComics([]);
        setTotalComics(0);
      }
      
      if (categoriesRes.data.success) {
        const categoriesArray = Array.isArray(categoriesRes.data.data) 
          ? categoriesRes.data.data 
          : [];
        setCategories(categoriesArray);
      }
      
      if (countriesRes.data.success) {
        const countriesArray = Array.isArray(countriesRes.data.data) 
          ? countriesRes.data.data 
          : [];
        setCountries(countriesArray);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu');
      console.error('Error fetching data:', err);
      setComics([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClosedVipComics = async () => {
    try {
      setLoadingClosedVipComics(true);
      const token = localStorage.getItem('token');
      const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`http://localhost:5000/api/admin/comics/closed-vip${searchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setClosedVipComics(data.data || []);
      } else {
        setClosedVipComics([]);
      }
    } catch (err) {
      console.error('Error fetching closed/vip comics:', err);
      setClosedVipComics([]);
    } finally {
      setLoadingClosedVipComics(false);
    }
  };

  const fetchAllVipChapters = async () => {
    try {
      setLoadingVipChapters(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/chapters/vip-all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllVipChapters(data.data || []);
      } else {
        setAllVipChapters([]);
      }
    } catch (err) {
      console.error('Error fetching all VIP chapters:', err);
      setAllVipChapters([]);
    } finally {
      setLoadingVipChapters(false);
    }
  };

  useEffect(() => {
    // Debounce search
    if (!isAuthenticated || user?.role !== 'admin') {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    // Fetch closed/vip comics and VIP chapters when component mounts or search changes
    if (isAuthenticated && user?.role === 'admin') {
      fetchClosedVipComics();
      fetchAllVipChapters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCrawlInputChange = (e) => {
    const { name, value } = e.target;
    setCrawlForm((prev) => ({
      ...prev,
      [name]: name === 'max_chapters' ? Number(value) : value
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => {
      const category_ids = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId];
      return { ...prev, category_ids };
    });
  };

  const handleCoverImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'category_ids') {
          formData.category_ids.forEach(id => {
            formDataToSend.append('category_ids[]', id);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (coverImage) {
        formDataToSend.append('cover_image', coverImage);
      }

      const url = editingComic 
        ? `http://localhost:5000/api/admin/comics/${editingComic.id}`
        : 'http://localhost:5000/api/admin/comics';
      
      const method = editingComic ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        setEditingComic(null);
        setFormData({
          title: '',
          author: '',
          description: '',
          status: 'ongoing',
          access_status: 'open',
          country_id: '',
          category_ids: []
        });
        setCoverImage(null);
        fetchData();
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Không thể lưu truyện. Vui lòng thử lại.');
      console.error('Error saving comic:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrawlComic = async (e) => {
    e.preventDefault();
    setError(null);
    setCrawlResult(null);

    if (!crawlForm.comic_url || !crawlForm.comic_url.trim()) {
      setError('Vui lòng nhập URL truyện POPS');
      return;
    }

    try {
      setCrawlLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/crawl/pops', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comic_url: crawlForm.comic_url.trim(),
          max_chapters: Number(crawlForm.max_chapters) || 20
        })
      });

      const data = await response.json();
      if (data.success) {
        setCrawlResult(data.data || null);
        fetchData();
      } else {
        setError(data.message || 'Cào truyện thất bại');
      }
    } catch (err) {
      setError('Không thể cào truyện. Vui lòng thử lại.');
      console.error('Error crawling comic:', err);
    } finally {
      setCrawlLoading(false);
    }
  };

  const handleEdit = (comic) => {
    setEditingComic(comic);
    setFormData({
      title: comic.title || '',
      author: comic.author || '',
      description: comic.description || '',
      status: comic.status || 'ongoing',
      access_status: comic.access_status || 'open',
      country_id: comic.country_id || '',
      category_ids: comic.categories ? comic.categories.map(c => c.id) : []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa truyện này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/comics/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        setError(data.message || 'Không thể xóa truyện');
      }
    } catch (err) {
      setError('Không thể xóa truyện. Vui lòng thử lại.');
      console.error('Error deleting comic:', err);
    }
  };

  const handleManageChapters = async (comic) => {
    setSelectedComic(comic);
    setChapterFormData({
      comic_id: comic.id,
      chapter_number: '',
      title: '',
      status: 'open'
    });
    setChapterImages([]);
    setShowChapterForm(false);
    
    try {
      const token = localStorage.getItem('token');
      const [chaptersRes, closedVipRes] = await Promise.all([
        fetch(`http://localhost:5000/api/chapters/comic/${comic.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`http://localhost:5000/api/admin/chapters/comic/${comic.id}/closed-vip`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      
      const chaptersData = await chaptersRes.json();
      const closedVipData = await closedVipRes.json();
      
      if (chaptersData.success) {
        setChapters(chaptersData.data || []);
      }
      if (closedVipData.success) {
        setClosedVipChapters(closedVipData.data || []);
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setChapters([]);
      setClosedVipChapters([]);
    }
  };

  const handleChapterInputChange = (e) => {
    const { name, value } = e.target;
    setChapterFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChapterImagesChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setChapterImages(files);
    }
  };

  const handleSubmitChapter = async (e) => {
    e.preventDefault();
    setSubmittingChapter(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('comic_id', chapterFormData.comic_id);
      formDataToSend.append('chapter_number', chapterFormData.chapter_number);
      if (chapterFormData.title) {
        formDataToSend.append('title', chapterFormData.title);
      }
      if (chapterFormData.status) {
        formDataToSend.append('status', chapterFormData.status);
      }

      chapterImages.forEach((file) => {
        formDataToSend.append('chapter_images', file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/chapters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        setShowChapterForm(false);
        setChapterFormData({
          comic_id: selectedComic.id,
          chapter_number: '',
          title: '',
          status: 'open'
        });
        setChapterImages([]);
        handleManageChapters(selectedComic); // Refresh chapters list
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Không thể tạo chương. Vui lòng thử lại.');
      console.error('Error creating chapter:', err);
    } finally {
      setSubmittingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        handleManageChapters(selectedComic); // Refresh chapters list
        fetchData(); // Refresh comics list to update total_chapters
      } else {
        setError(data.message || 'Không thể xóa chương');
      }
    } catch (err) {
      setError('Không thể xóa chương. Vui lòng thử lại.');
      console.error('Error deleting chapter:', err);
    }
  };

  const handleToggleChapterStatus = async (chapterId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/chapters/${chapterId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        handleManageChapters(selectedComic); // Refresh chapters list
        fetchClosedVipComics(); // Refresh closed/VIP comics list
        fetchAllVipChapters(); // Refresh all VIP/closed chapters list
        fetchData(); // Refresh comics list to update total_chapters if needed
      } else {
        setError(data.message || 'Không thể cập nhật trạng thái');
      }
    } catch (err) {
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
      console.error('Error toggling chapter status:', err);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="admin-comics-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="page-title">Quản lý truyện</h1>
          <button 
            onClick={() => {
              setShowForm(!showForm);
              setEditingComic(null);
              setFormData({
                title: '',
                author: '',
                description: '',
                status: 'ongoing',
                country_id: '',
                category_ids: []
              });
              setCoverImage(null);
            }}
            className="btn-add"
          >
            {showForm ? 'Hủy' : '+ Thêm truyện mới'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="crawl-section">
          <h2>Crawl truyện từ URL (POPS)</h2>
          <p className="crawl-hint">
            Dán URL truyện từ pops.vn, hệ thống sẽ tự lấy metadata và ảnh chương.
          </p>
          <form className="crawl-form" onSubmit={handleCrawlComic}>
            <div className="crawl-row">
              <div className="form-group">
                <label>Comic URL *</label>
                <input
                  type="url"
                  name="comic_url"
                  value={crawlForm.comic_url}
                  onChange={handleCrawlInputChange}
                  placeholder="https://pops.vn/comics/..."
                  required
                />
              </div>
              <div className="form-group crawl-max-chapters">
                <label>Số chương tối đa</label>
                <input
                  type="number"
                  name="max_chapters"
                  min="1"
                  max="200"
                  value={crawlForm.max_chapters}
                  onChange={handleCrawlInputChange}
                />
              </div>
            </div>
            <div className="crawl-actions">
              <button type="submit" className="btn-save" disabled={crawlLoading}>
                {crawlLoading ? 'Đang cào dữ liệu...' : 'Bắt đầu crawl'}
              </button>
            </div>
          </form>

          {crawlResult && (
            <div className="crawl-result">
              <strong>Crawl thành công:</strong>{' '}
              Comic ID {crawlResult.comicId} - {crawlResult.upsertedChapterCount} chương - {crawlResult.upsertedPageCount} ảnh
            </div>
          )}
        </div>

        {showForm && (
          <div className="comic-form-section">
            <h2>{editingComic ? 'Chỉnh sửa truyện' : 'Thêm truyện mới'}</h2>
            <form onSubmit={handleSubmit} className="comic-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tên truyện *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập tên truyện"
                  />
                </div>

                <div className="form-group">
                  <label>Tác giả</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Nhập tên tác giả"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tình trạng</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="ongoing">Đang cập nhật</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái truy cập</label>
                  <select
                    name="access_status"
                    value={formData.access_status}
                    onChange={handleInputChange}
                  >
                    <option value="open">Mở</option>
                    <option value="closed">Đóng</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nước</label>
                  <select
                    name="country_id"
                    value={formData.country_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn nước</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Nhập mô tả truyện"
                />
              </div>

              <div className="form-group">
                <label>Thể loại</label>
                <div className="categories-checkboxes">
                  {categories.map(category => (
                    <label key={category.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.category_ids.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Ảnh bìa {!editingComic && '*'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  required={!editingComic}
                />
                {coverImage && (
                  <div className="image-preview">
                    <img 
                      src={URL.createObjectURL(coverImage)} 
                      alt="Preview" 
                      className="preview-img"
                    />
                  </div>
                )}
                {editingComic && !coverImage && (
                  <div className="image-preview">
                    <img 
                      src={getImageUrl(editingComic.cover_image) || 'https://via.placeholder.com/200x300'} 
                      alt="Current" 
                      className="preview-img"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x300';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingComic ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingComic(null);
                  }}
                  className="btn-cancel"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="admin-comics-layout">
          {/* Cột 1: Danh sách truyện */}
          <div className="comics-table-section comics-list-column">
            <div className="table-header-with-search">
              <h2>Danh sách truyện <span className="total-count">({totalComics})</span></h2>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên truyện hoặc tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="comics-table">
            <table>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên truyện</th>
                  <th>Tác giả</th>
                  <th>Tình trạng</th>
                  <th>Số chương</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(comics) && comics.length > 0 ? (
                  comics.map(comic => (
                    <tr key={comic.id}>
                      <td>
                        <img 
                          src={getImageUrl(comic.cover_image) || 'https://via.placeholder.com/60x80'} 
                          alt={comic.title}
                          className="table-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60x80';
                          }}
                        />
                      </td>
                      <td>{comic.title}</td>
                      <td>{comic.author || '-'}</td>
                      <td>
                        <span className={`status-badge ${comic.status}`}>
                          {comic.status === 'ongoing' ? 'Đang ra' : 'Hoàn thành'}
                        </span>
                      </td>
                      <td>{comic.total_chapters || 0}</td>
                      <td>
                        <div className="action-buttons-table">
                          <button 
                            onClick={() => handleEdit(comic)}
                            className="btn-edit"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => handleManageChapters(comic)}
                            className="btn-chapters"
                          >
                            Chương
                          </button>
                          <button 
                            onClick={() => handleDelete(comic.id)}
                            className="btn-delete"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      {loading ? 'Đang tải...' : 'Không có truyện nào'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>

          {/* Cột 2: Quản lý truyện VIP */}
          <div className="vip-management-column">
            {/* Truyện VIP */}
            <div className="vip-comics-section">
              <h3>Truyện VIP và Đóng ({closedVipComics.length})</h3>
              {loadingClosedVipComics ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
              ) : closedVipComics.length > 0 ? (
                <div className="vip-comics-list">
                  {closedVipComics.map(comic => (
                    <div key={comic.id} className="vip-comic-item">
                      <div className="vip-comic-header">
                        <img 
                          src={getImageUrl(comic.cover_image) || 'https://via.placeholder.com/50x70'} 
                          alt={comic.title}
                          className="vip-comic-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x70';
                          }}
                        />
                        <div className="vip-comic-info">
                          <h4>{comic.title}</h4>
                          <div className="vip-comic-badges">
                            <span className={`access-status-badge ${comic.access_status}`}>
                              {comic.access_status === 'closed' ? 'Đóng' : comic.access_status === 'vip' ? 'VIP' : 'Mở'}
                            </span>
                            <span className={`status-badge ${comic.status}`}>
                              {comic.status === 'ongoing' ? 'Đang ra' : 'Hoàn thành'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="vip-comic-actions">
                        <button 
                          onClick={() => handleEdit(comic)}
                          className="btn-edit-small"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleManageChapters(comic)}
                          className="btn-chapters-small"
                        >
                          Chương
                        </button>
                        <button 
                          onClick={() => handleDelete(comic.id)}
                          className="btn-delete-small"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                  Không có truyện VIP hoặc đóng
                </div>
              )}
            </div>

          </div>

          {/* Cột 3: Chương VIP và Đóng */}
          <div className="vip-chapters-column">
            <div className="vip-chapters-section">
              <h3>Chương VIP và Đóng ({allVipChapters.length})</h3>
              {loadingVipChapters ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
              ) : allVipChapters.length > 0 ? (
                <div className="vip-chapters-list">
                  {allVipChapters.map(chapter => (
                    <div key={chapter.id} className={`vip-chapter-item ${chapter.status === 'closed' ? 'chapter-closed-item' : 'chapter-vip-item'}`}>
                      <div className="vip-chapter-info">
                        <div className="vip-chapter-comic">
                          <strong>{chapter.comic_title}</strong>
                        </div>
                        <div className="vip-chapter-details">
                          <span>Chương {chapter.chapter_number}</span>
                          {chapter.title && <span>: {chapter.title}</span>}
                          <span className={`chapter-status-badge-inline ${chapter.status}`} style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {chapter.status === 'vip' ? 'VIP' : 'Đóng'}
                          </span>
                        </div>
                        <div className="vip-chapter-meta">
                          <span>👁 {chapter.views || 0}</span>
                          <span>{new Date(chapter.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="vip-chapter-actions">
                        <button
                          onClick={() => {
                            const comic = closedVipComics.find(c => c.id === chapter.comic_id) || comics.find(c => c.id === chapter.comic_id);
                            if (comic) {
                              handleManageChapters(comic);
                            }
                          }}
                          className="btn-edit-small"
                        >
                          Quản lý
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                  Không có chương VIP hoặc đóng
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal quản lý chương */}
        {selectedComic && (
          <div className="chapters-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Quản lý chương: {selectedComic.title}</h2>
                <button 
                  className="btn-close"
                  onClick={() => {
                    setSelectedComic(null);
                    setChapters([]);
                    setShowChapterForm(false);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="chapters-actions">
                  <button 
                    onClick={() => setShowChapterForm(!showChapterForm)}
                    className="btn-add-chapter"
                  >
                    {showChapterForm ? 'Hủy' : '+ Thêm chương mới'}
                  </button>
                </div>

                {showChapterForm && (
                  <form onSubmit={handleSubmitChapter} className="chapter-form">
                    <div className="form-group">
                      <label>Số chương *</label>
                      <input
                        type="number"
                        name="chapter_number"
                        value={chapterFormData.chapter_number}
                        onChange={handleChapterInputChange}
                        required
                        min="1"
                        placeholder="Nhập số chương"
                      />
                    </div>

                    <div className="form-group">
                      <label>Tiêu đề chương</label>
                      <input
                        type="text"
                        name="title"
                        value={chapterFormData.title}
                        onChange={handleChapterInputChange}
                        placeholder="Nhập tiêu đề chương (tùy chọn)"
                      />
                    </div>

                    <div className="form-group">
                      <label>Trạng thái chương</label>
                      <select
                        name="status"
                        value={chapterFormData.status}
                        onChange={handleChapterInputChange}
                      >
                        <option value="open">Mở</option>
                        <option value="closed">Đóng</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Ảnh chương * (có thể chọn nhiều ảnh)</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleChapterImagesChange}
                        required
                      />
                      <small>Chọn nhiều ảnh cùng lúc (Ctrl+Click hoặc Shift+Click để chọn nhiều). Thứ tự ảnh sẽ theo thứ tự bạn chọn.</small>
                      {chapterImages.length > 0 && (
                        <div className="images-preview">
                          <p className="images-count">Đã chọn <strong>{chapterImages.length}</strong> ảnh</p>
                          <div className="images-grid-preview">
                            {chapterImages.map((file, index) => (
                              <div key={index} className="image-preview-item">
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt={`Preview ${index + 1}`}
                                  className="preview-thumbnail"
                                />
                                <span className="image-number">{index + 1}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setChapterImages([]);
                              // Reset file input
                              const fileInput = document.querySelector('input[type="file"][multiple]');
                              if (fileInput) fileInput.value = '';
                            }}
                            className="btn-clear-images"
                          >
                            Xóa tất cả ảnh
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={submittingChapter}>
                        {submittingChapter ? 'Đang tạo...' : 'Tạo chương'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="chapters-list-section">
                  <h3>Danh sách chương ({chapters.length})</h3>
                  
                  {closedVipChapters.length > 0 && (
                    <div className="closed-vip-chapters-section">
                      <h4>Chương đóng và VIP ({closedVipChapters.length})</h4>
                      <table className="chapters-table">
                        <thead>
                          <tr>
                            <th>Số chương</th>
                            <th>Tiêu đề</th>
                            <th>Ngày tạo</th>
                            <th>Lượt xem</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {closedVipChapters.map(chapter => (
                            <tr key={chapter.id}>
                              <td>Chương {chapter.chapter_number}</td>
                              <td>{chapter.title || '-'}</td>
                              <td>{new Date(chapter.created_at).toLocaleDateString('vi-VN')}</td>
                              <td>{chapter.views || 0}</td>
                              <td>
                                <select
                                  value={chapter.status || 'open'}
                                  onChange={(e) => handleToggleChapterStatus(chapter.id, e.target.value)}
                                  className="chapter-status-select"
                                >
                                  <option value="open">Mở</option>
                                  <option value="closed">Đóng</option>
                                  <option value="vip">VIP</option>
                                </select>
                              </td>
                              <td>
                                <button 
                                  onClick={() => handleDeleteChapter(chapter.id)}
                                  className="btn-delete-small"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {chapters.length > 0 ? (
                    <table className="chapters-table">
                      <thead>
                        <tr>
                          <th>Số chương</th>
                          <th>Tiêu đề</th>
                          <th>Ngày tạo</th>
                          <th>Lượt xem</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chapters.map(chapter => (
                          <tr key={chapter.id}>
                            <td>Chương {chapter.chapter_number}</td>
                            <td>{chapter.title || '-'}</td>
                            <td>{new Date(chapter.created_at).toLocaleDateString('vi-VN')}</td>
                            <td>{chapter.views || 0}</td>
                            <td>
                              <select
                                value={chapter.status || 'open'}
                                onChange={(e) => handleToggleChapterStatus(chapter.id, e.target.value)}
                                className="chapter-status-select"
                              >
                                <option value="open">Mở</option>
                                <option value="closed">Đóng</option>
                                <option value="vip">VIP</option>
                              </select>
                            </td>
                            <td>
                              <button 
                                onClick={() => handleDeleteChapter(chapter.id)}
                                className="btn-delete-small"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-chapters">Chưa có chương nào</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComics;

