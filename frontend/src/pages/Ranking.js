import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getComics, getCountries } from '../services/api';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './Ranking.css';

const RANKING_CONFIG = {
  day: { 
    label: 'Top ngày', 
    sort: 'views_day',
    description: 'Truyện có lượt xem nhiều nhất trong ngày'
  },
  week: { 
    label: 'Top tuần', 
    sort: 'views_week',
    description: 'Truyện có lượt xem nhiều nhất trong tuần'
  },
  month: { 
    label: 'Top tháng', 
    sort: 'views_month',
    description: 'Truyện có lượt xem nhiều nhất trong tháng'
  },
  favorite: { 
    label: 'Yêu thích', 
    sort: 'favorites',
    description: 'Truyện được xếp theo số lượt thích cao nhất và giảm dần'
  },
  latest_update: { 
    label: 'Mới cập nhật', 
    sort: 'latest_update',
    description: 'Các chương truyện được cập nhật mới nhất'
  },
  new_comic: { 
    label: 'Truyện mới', 
    sort: 'new_comic',
    description: 'Truyện được thêm vào mới nhất'
  },
  full: { 
    label: 'Truyện full', 
    sort: 'full',
    description: 'Truyện đã hoàn thành'
  },
};

const STATUS_OPTIONS = [
  { value: 'ongoing', label: 'Đang tiến hành' },
  { value: 'completed', label: 'Hoàn thành' },
];

const Ranking = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'day';
  const config = RANKING_CONFIG[type] || RANKING_CONFIG.day;

  const [comics, setComics] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    country_id: '',
  });

  // Load countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getCountries();
        if (response.data.success) {
          setCountries(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };
    fetchCountries();
  }, []);

  // Fetch comics with filters
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          sort: config.sort,
          limit: 30,
        };
        
        if (filters.status) {
          params.status = filters.status;
        }
        if (filters.country_id) {
          params.country_id = filters.country_id;
        }

        const response = await getComics(params);
        if (response.data.success) {
          const data = Array.isArray(response.data.data)
            ? response.data.data
            : (response.data.data?.data || []);
          setComics(data);
        } else {
          setComics([]);
        }
      } catch (err) {
        console.error('Error fetching ranking comics:', err);
        setError('Không thể tải bảng xếp hạng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [config.sort, filters.status, filters.country_id]);

  const handleStatusChange = (status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status === status ? '' : status,
    }));
  };

  const handleCountryChange = (countryId) => {
    setFilters(prev => ({
      ...prev,
      country_id: prev.country_id === countryId ? '' : countryId,
    }));
  };

  if (loading && comics.length === 0) {
    return <Loading />;
  }

  return (
    <div className="ranking-page">
      <div className="container">
        {/* Header with icon and title */}
        <div className="ranking-header">
          <span className="ranking-icon">🏳️</span>
          <h1 className="ranking-title">{config.label}</h1>
        </div>

        {/* Filter Panel */}
        <div className="ranking-filter-panel">
          {/* Tình trạng filter */}
          <div className="filter-row">
            <span className="filter-label">Tình trạng</span>
            <div className="filter-buttons">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={`filter-button ${filters.status === option.value ? 'active' : ''}`}
                  onClick={() => handleStatusChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quốc gia filter */}
          <div className="filter-row">
            <span className="filter-label">Quốc gia</span>
            <div className="filter-buttons">
              {countries.map(country => (
                <button
                  key={country.id}
                  className={`filter-button ${filters.country_id === country.id ? 'active' : ''}`}
                  onClick={() => handleCountryChange(country.id)}
                >
                  {country.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Comics Grid - 6 columns per row */}
        {comics.length > 0 ? (
          <div className="ranking-comics-grid">
            {comics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        ) : (
          !loading && <div className="no-results">Không có truyện phù hợp.</div>
        )}
      </div>
    </div>
  );
};

export default Ranking;


