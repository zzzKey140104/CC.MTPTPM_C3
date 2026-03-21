import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFavorites } from '../services/api';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './Favorites.css';

const Favorites = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFavorites();
  }, [isAuthenticated, navigate]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      if (response.data.success) {
        setComics(response.data.data);
      }
    } catch (err) {
      setError('Không thể tải danh sách theo dõi. Vui lòng thử lại sau.');
      console.error('Error fetching favorites:', err);
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
    <div className="favorites-page">
      <div className="container">
        <h1 className="page-title">Truyện đang theo dõi</h1>

        {error && <div className="error-message">{error}</div>}

        {comics.length > 0 ? (
          <div className="comics-grid-favorites">
            {comics.map(comic => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>Bạn chưa theo dõi truyện nào</p>
            <p className="sub-text">Hãy thêm truyện vào danh sách theo dõi để xem ở đây!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

