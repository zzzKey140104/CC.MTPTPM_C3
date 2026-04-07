import React, { useState, useEffect } from 'react';
import { getComics, getCountries } from '../services/api';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './ComicsList.css';

const ComicsList = () => {
  const [comics, setComics] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    country_id: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  // Khi vào trang danh sách truyện, cuộn lên đầu trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getCountries();
        if (response.data.success) {
          setCountries(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true);
        const response = await getComics({
          page: pagination.page,
          limit: 30,
          status: filters.status,
          country_id: filters.country_id
        });
        
        if (response.data.success) {
          // Backend hiện đang bọc dữ liệu theo dạng:
          // { success, message, data: { data: [...comics], pagination: {...} } }
          const payload = response.data.data || {};
          const comicsData = payload.data || [];
          const paginationData = payload.pagination || {};

          setComics(comicsData);
          setPagination(prev => ({
            ...prev,
            totalPages: paginationData.totalPages || prev.totalPages,
            total: paginationData.total ?? prev.total
          }));
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error('Error fetching comics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComics();
  }, [filters.status, filters.country_id, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    const { page, totalPages } = pagination;
    const pages = [];
    
    // Tính toán các trang hiển thị
    let startPage = Math.max(1, page - 1);
    let endPage = Math.min(totalPages, page + 1);
    
    if (page <= 2) {
      endPage = Math.min(5, totalPages);
    }
    if (page >= totalPages - 1) {
      startPage = Math.max(1, totalPages - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
        >
          &lt;&lt;
        </button>
        <button
          className="page-btn"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          &lt;
        </button>
        
        {startPage > 1 && (
          <>
            <button
              className="page-btn"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="page-ellipsis">...</span>}
          </>
        )}
        
        {pages.map(p => (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => handlePageChange(p)}
          >
            {p}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="page-ellipsis">...</span>}
            <button
              className="page-btn"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          className="page-btn"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          &gt;
        </button>
        <button
          className="page-btn"
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
        >
          &gt;&gt;
        </button>
      </div>
    );
  };

  if (loading && comics.length === 0) {
    return <Loading />;
  }

  return (
    <div className="comics-list-page">
      <div className="container">
        <h1 className="page-title">Truyện mới cập nhật</h1>

        {/* Bộ lọc */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Tình trạng truyện:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="ongoing">Đang cập nhật</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Nước:</label>
            <select
              value={filters.country_id}
              onChange={(e) => handleFilterChange('country_id', e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Danh sách truyện */}
        {comics.length > 0 ? (
          <>
            <div className="comics-grid-list">
              {comics.map(comic => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination-section">
                {renderPagination()}
              </div>
            )}
          </>
        ) : (
          !loading && <div className="no-results">Không tìm thấy truyện nào</div>
        )}
      </div>
    </div>
  );
};

export default ComicsList;

