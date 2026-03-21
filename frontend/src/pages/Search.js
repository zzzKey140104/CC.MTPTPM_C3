import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useComicsSearch } from '../hooks/useComics';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [page, setPage] = useState(1);
  const { comics, loading, error, pagination } = useComicsSearch(query, page, 20);

  // Reset page khi query thay đổi
  useEffect(() => {
    setPage(1);
  }, [query]);

  if (loading && comics.length === 0) {
    return <Loading />;
  }

  return (
    <div className="search-page">
      <div className="container">
        <h1 className="page-title">Kết quả tìm kiếm: "{query}"</h1>
        
        {error && <div className="error-message">{error}</div>}

        {comics.length > 0 ? (
          <>
            <div className="search-results">
              <div className="comics-grid-search">
                {comics.map(comic => (
                  <ComicCard key={comic.id} comic={comic} />
                ))}
              </div>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="page-btn"
                >
                  Trước
                </button>
                <span className="page-info">Trang {page} / {pagination.totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="page-btn"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          !loading && <div className="no-results">Không tìm thấy kết quả nào</div>
        )}
      </div>
    </div>
  );
};

export default Search;

