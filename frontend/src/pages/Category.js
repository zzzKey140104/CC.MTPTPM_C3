import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getComicsByCategory, getCategoryById } from '../services/api';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './Category.css';

const Category = () => {
  const { id } = useParams();
  const [comics, setComics] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchCategory();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchComics();
    }
  }, [id, pagination.page]);

  const fetchCategory = async () => {
    try {
      const response = await getCategoryById(id);
      if (response.data.success) {
        setCategory(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching category:', err);
    }
  };

  const fetchComics = async () => {
    try {
      setLoading(true);
      const response = await getComicsByCategory(id, {
        page: pagination.page,
        limit: 20
      });
      
      if (response.data.success) {
        // Kiểm tra nếu data là array trực tiếp hoặc trong object
        const comicsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data?.data || []);
        setComics(comicsData);
        
        // Xử lý pagination
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page || 1,
            totalPages: response.data.pagination.totalPages || 1,
            total: response.data.pagination.total || 0
          });
        } else {
          // Nếu không có pagination, tính toán từ data
          setPagination(prev => ({
            ...prev,
            totalPages: comicsData.length > 0 ? 1 : 0,
            total: comicsData.length
          }));
        }
      }
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      console.error('Error fetching comics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && comics.length === 0) {
    return <Loading />;
  }

  return (
    <div className="category-page">
      <div className="container">
        <h1 className="page-title">
          {category ? `Thể loại: ${category.name}` : 'Thể loại'}
        </h1>

        {error && <div className="error-message">{error}</div>}

        {comics.length > 0 ? (
          <>
            <div className="comics-grid-category">
              {comics.map(comic => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination-section">
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                  >
                    &lt;&lt;
                  </button>
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    &lt;
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`page-btn ${pageNum === pagination.page ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    &gt;
                  </button>
                  <button
                    className="page-btn"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          !loading && <div className="no-results">Không có truyện nào trong thể loại này</div>
        )}
      </div>
    </div>
  );
};

export default Category;

