import React, { useEffect, useMemo, useState } from 'react';
import { getCategories, getCountries, getComicsWithFilters } from '../services/api';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './ComicsList.css';
import './Search.css';

const CATEGORY_MODE = {
  NONE: 'none',      // Bình thường (default)
  INCLUDE: 'include', // Chọn
  EXCLUDE: 'exclude', // Loại
};

const AdvancedSearch = () => {
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [country, setCountry] = useState('all');
  const [status, setStatus] = useState('all');
  const [minChapters, setMinChapters] = useState('0');
  const [sort, setSort] = useState('latest_update');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comics, setComics] = useState([]);

  // Load categories & countries
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, countryRes] = await Promise.all([
          getCategories(),
          getCountries(),
        ]);

        if (catRes.data?.success) {
          setCategories(catRes.data.data || []);
        }

        if (countryRes.data?.success) {
          setCountries(countryRes.data.data || []);
        }
      } catch (err) {
        console.error('Error loading filter data:', err);
      }
    };

    fetchFilters();
  }, []);

  const handleCategoryClick = (id) => {
    setSelectedCategories((prev) => {
      const current = prev[id] || CATEGORY_MODE.NONE;
      let next;
      // Chuyển đổi: Bình thường -> Chọn -> Loại -> Bình thường
      if (current === CATEGORY_MODE.NONE) next = CATEGORY_MODE.INCLUDE;
      else if (current === CATEGORY_MODE.INCLUDE) next = CATEGORY_MODE.EXCLUDE;
      else next = CATEGORY_MODE.NONE;

      return {
        ...prev,
        [id]: next,
      };
    });
  };

  const { includeCategories, excludeCategories } = useMemo(() => {
    const include = [];
    const exclude = [];

    Object.entries(selectedCategories).forEach(([id, mode]) => {
      if (mode === CATEGORY_MODE.INCLUDE) include.push(id);
      if (mode === CATEGORY_MODE.EXCLUDE) exclude.push(id);
    });

    return {
      includeCategories: include,
      excludeCategories: exclude,
    };
  }, [selectedCategories]);

  const fetchComics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        sort,
        country_id: country !== 'all' ? country : undefined,
        status: status !== 'all' ? status : undefined,
        minChapters: minChapters !== '0' ? Number(minChapters) : undefined,
        includeCategories: includeCategories.length ? includeCategories.join(',') : undefined,
        excludeCategories: excludeCategories.length ? excludeCategories.join(',') : undefined,
      };

      const response = await getComicsWithFilters(params);

      if (response.data.success) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data?.data || []);
        setComics(data);
      } else {
        setComics([]);
      }
    } catch (err) {
      console.error('Error fetching comics with filters:', err);
      setError('Không thể tải danh sách truyện. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial comics - list chương mới cập nhật
    const loadInitialComics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getComicsWithFilters({ sort: 'latest_update', limit: 30 });
        if (response.data.success) {
          const data = Array.isArray(response.data.data)
            ? response.data.data
            : (response.data.data?.data || []);
          setComics(data);
        } else {
          setComics([]);
        }
      } catch (err) {
        console.error('Error loading initial comics:', err);
        setError('Không thể tải danh sách truyện. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialComics();
  }, []);

  const renderCategoryStateLabel = (mode) => {
    if (mode === CATEGORY_MODE.INCLUDE) return 'Chọn';
    if (mode === CATEGORY_MODE.EXCLUDE) return 'Loại';
    return 'Bình thường';
  };

  const handleReset = async () => {
    // Reset tất cả filters về giá trị mặc định
    setSelectedCategories({});
    setCountry('all');
    setStatus('all');
    setMinChapters('0');
    setSort('latest_update');

    // Load lại danh sách với giá trị mặc định
    try {
      setLoading(true);
      setError(null);
      const response = await getComicsWithFilters({ sort: 'latest_update', limit: 30 });
      if (response.data.success) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data?.data || []);
        setComics(data);
      } else {
        setComics([]);
      }
    } catch (err) {
      console.error('Error loading comics after reset:', err);
      setError('Không thể tải danh sách truyện. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="container">
        {/* Header with icon */}
        <div className="advanced-search-header">
          <span className="search-icon">🔍</span>
          <h1 className="page-title">Tìm kiếm nâng cao</h1>
        </div>

        <div className="filter-panel">

          <div className="filter-genres">
            <div className="genres-grid">
              {categories.map((cat) => {
                const mode = selectedCategories[cat.id] || CATEGORY_MODE.NONE;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`genre-item genre-${mode}`}
                    onClick={() => handleCategoryClick(cat.id)}
                    title={renderCategoryStateLabel(mode)}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-field">
              <label>Quốc gia</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="all">Tất cả</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>Tình trạng</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="ongoing">Đang tiến hành</option>
                <option value="completed">Hoàn thành</option>
                <option value="paused">Tạm dừng</option>
              </select>
            </div>

            <div className="filter-field">
              <label>Số lượng chương</label>
              <select value={minChapters} onChange={(e) => setMinChapters(e.target.value)}>
                <option value="0">&gt; 0</option>
                <option value="10">&gt;= 10</option>
                <option value="50">&gt;= 50</option>
                <option value="100">&gt;= 100</option>
              </select>
            </div>

            <div className="filter-field">
              <label>Sắp xếp</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="latest_update">Ngày đăng giảm dần</option>
                <option value="new_comic">Truyện mới</option>
                <option value="views_day">Top ngày</option>
                <option value="views_week">Top tuần</option>
                <option value="views_month">Top tháng</option>
                <option value="favorites">Yêu thích</option>
                <option value="full">Truyện full</option>
              </select>
            </div>

            <div className="filter-actions">
              <button type="button" className="btn btn-primary" onClick={fetchComics}>
                Tìm kiếm
              </button>
              <button type="button" className="btn btn-reset" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
        </div>

        {loading && <Loading />}
        {error && <div className="error-message">{error}</div>}

        {!loading && (
          <div className="search-results">
            <div className="comics-grid-search">
              {comics.map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>

            {comics.length === 0 && !error && (
              <div className="no-results">Không có truyện phù hợp.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;


