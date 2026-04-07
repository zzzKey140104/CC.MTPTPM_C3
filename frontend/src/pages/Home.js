import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLatestComics, usePopularComics } from '../hooks/useComics';
import Loading from '../components/common/Loading';
import ComicCard from '../components/features/ComicCard';
import './Home.css';

const Home = () => {
  const { comics: popularComics, loading: popularLoading, error: popularError } = usePopularComics(8);
  const { comics: latestComics, loading: latestLoading, error: latestError } = useLatestComics(18);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loading = latestLoading || popularLoading;
  const error = latestError || popularError;

  // Tính toán số items có thể hiển thị (5 items)
  const itemsPerView = 5;
  const maxIndex = Math.max(0, popularComics.length - itemsPerView);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Tối ưu: sử dụng useMemo để tránh tính toán lại mỗi lần render
  const latestRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < latestComics.length; i += 6) {
      rows.push(latestComics.slice(i, i + 6));
    }
    return rows;
  }, [latestComics]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home">
      <div className="container">
        {/* Truyện nổi bật */}
        <section className="comics-section">
          <h2 className="section-title">Truyện nổi bật</h2>
          <div className="popular-carousel-wrapper">
            <button 
              className="carousel-btn carousel-btn-prev" 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              ‹
            </button>
            <div className="popular-carousel-container">
              <div 
                className="popular-carousel"
                style={{ 
                  '--current-index': currentIndex,
                  transform: `translateX(calc(-1 * var(--current-index) * (100% + 20px) / 5))` 
                }}
              >
                {popularComics.map((comic) => (
                  <div key={comic.id} className="popular-carousel-item">
                    <ComicCard comic={comic} />
                  </div>
                ))}
              </div>
            </div>
            <button 
              className="carousel-btn carousel-btn-next" 
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </section>

        {/* Mới cập nhật */}
        <section className="comics-section">
          <h2 className="section-title">Mới cập nhật</h2>
          {latestRows.map((row, rowIndex) => (
            <div key={rowIndex} className="comics-row">
              <div className="comics-grid latest-grid">
                {row.map(comic => (
                  <ComicCard key={comic.id} comic={comic} />
                ))}
              </div>
            </div>
          ))}
          
          {latestComics.length >= 18 && (
            <div className="view-more-section">
              <Link to="/comics" className="btn-view-more">
                Xem thêm truyện
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;

