import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getReadingHistory, deleteReadingHistory, deleteAllReadingHistory } from '../services/api';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './History.css';

const History = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchHistory();

    // Tự động refresh khi người dùng quay lại tab/window
    const handleFocus = () => {
      fetchHistory();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, navigate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReadingHistory(50);
      if (response.data.success) {
        setComics(response.data.data);
      }
    } catch (err) {
      setError('Không thể tải lịch sử đọc. Vui lòng thử lại sau.');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comicId) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch sử đọc của truyện này?')) {
      return;
    }
    try {
      setDeleting(comicId);
      await deleteReadingHistory(comicId);
      // Làm mới danh sách sau khi xóa
      await fetchHistory();
    } catch (err) {
      setError('Không thể xóa lịch sử đọc. Vui lòng thử lại sau.');
      console.error('Error deleting history:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đọc? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      setLoading(true);
      await deleteAllReadingHistory();
      setComics([]);
    } catch (err) {
      setError('Không thể xóa lịch sử đọc. Vui lòng thử lại sau.');
      console.error('Error deleting all history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="history-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Lịch sử đọc</h1>
          <div className="header-actions">
            {comics.length > 0 && (
              <button 
                onClick={handleDeleteAll} 
                className="btn-delete-all"
                disabled={loading}
                title="Xóa toàn bộ"
              >
                🗑️ Xóa tất cả
              </button>
            )}
            <button 
              onClick={fetchHistory} 
              className="btn-refresh"
              disabled={loading}
              title="Làm mới"
            >
              🔄 {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {comics.length > 0 ? (
          <div className="comics-grid-history">
            {comics.map(comic => (
              <div key={comic.id} className="history-item">
                <ComicCard comic={comic} />
                {comic.last_chapter_number && (
                  <div className="last-read-info">
                    <span>Đã đọc đến: Chương {comic.last_chapter_number}</span>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(comic.id)}
                  className="btn-delete-item"
                  disabled={deleting === comic.id}
                  title="Xóa lịch sử"
                >
                  {deleting === comic.id ? '⏳' : '🗑️'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>Bạn chưa đọc truyện nào</p>
            <p className="sub-text">Hãy bắt đầu đọc truyện để xem lịch sử ở đây!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

