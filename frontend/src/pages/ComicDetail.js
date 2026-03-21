import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useComic } from '../hooks/useComic';
import { useAuth } from '../contexts/AuthContext';
import { toggleFavorite, checkFavorite, toggleLike, checkLike, addReadingHistory, getReadingHistoryByComic, summarizeComic } from '../services/api';
import Loading from '../components/common/Loading';
import CommentsSection from '../components/features/CommentsSection';
import { COMIC_STATUS_LABELS, IMAGE_PLACEHOLDER } from '../constants';
import { formatDate, getImageUrl } from '../utils/helpers';
import './ComicDetail.css';

const ComicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { comic, loading, error } = useComic(id);
  const { isAuthenticated, user } = useAuth();
  const userIsVip = user && (user.role === 'vip' || user.role === 'admin');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (comic && isAuthenticated) {
      checkFavoriteStatus();
      checkLikeStatus();
      fetchLastReadChapter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comic, isAuthenticated]);

  const fetchLastReadChapter = async () => {
    try {
      const response = await getReadingHistoryByComic(id);
      if (response.data.success && response.data.data) {
        const history = response.data.data;
        // Tìm chapter trong danh sách chapters của comic
        if (comic.chapters && history.chapter_id) {
          const chapter = comic.chapters.find(ch => ch.id === history.chapter_id);
          if (chapter) {
            setLastReadChapter(chapter);
          } else {
            // Nếu không tìm thấy chapter, xóa lastReadChapter
            setLastReadChapter(null);
          }
        } else {
          // Nếu không có lịch sử, xóa lastReadChapter
          setLastReadChapter(null);
        }
      } else {
        // Nếu không có dữ liệu, xóa lastReadChapter
        setLastReadChapter(null);
      }
    } catch (err) {
      console.error('Error fetching last read chapter:', err);
      // Khi có lỗi, cũng xóa lastReadChapter để tránh hiển thị sai
      setLastReadChapter(null);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const response = await checkFavorite(id);
      if (response.data.success) {
        setIsFavorite(response.data.data.isFavorite);
      }
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await checkLike(id);
      if (response.data.success) {
        setIsLiked(response.data.data.isLiked);
      }
    } catch (err) {
      console.error('Error checking like:', err);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setLoadingAction(true);
      const response = await toggleFavorite(id);
      if (response.data.success) {
        setIsFavorite(response.data.data.isFavorite);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setLoadingAction(true);
      const response = await toggleLike(id);
      if (response.data.success) {
        setIsLiked(response.data.data.isLiked);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReadFromStart = () => {
    if (comic?.chapters && comic.chapters.length > 0) {
      const firstChapter = comic.chapters[0];
      // Kiểm tra nếu chương đầu tiên là VIP và user không phải VIP
      if (firstChapter.status === 'vip' && !userIsVip) {
        alert('Chương này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.');
        return;
      }
      navigate(`/chapter/${firstChapter.id}`);
    }
  };

  const handleContinueReading = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Lấy chương đã đọc gần nhất từ history
    if (lastReadChapter) {
      // Kiểm tra nếu chương là VIP và user không phải VIP
      if (lastReadChapter.status === 'vip' && !userIsVip) {
        alert('Chương này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.');
        return;
      }
      navigate(`/chapter/${lastReadChapter.id}`);
    } else if (comic?.chapters && comic.chapters.length > 0) {
      // Nếu chưa có lịch sử, đọc từ đầu
      handleReadFromStart();
    }
  };

  const handleSummarizeComic = async () => {
    if (!comic) return;
    
    try {
      setLoadingSummary(true);
      const response = await summarizeComic(id);
      if (response.data.success) {
        setAiSummary(response.data.data.summary);
        setShowSummary(true);
      } else {
        alert('Lỗi khi tạo tóm tắt: ' + (response.data.message || 'Vui lòng thử lại'));
      }
    } catch (error) {
      console.error('Error summarizing comic:', error);
      alert('Lỗi khi tạo tóm tắt. Vui lòng thử lại sau.');
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !comic) {
    const isVipError = error && (error.includes('VIP') || error.includes('vip'));
    const isClosedError = error && (error.includes('đóng') || error.includes('closed'));
    return (
      <div className="comic-detail">
        <div className="container">
          <div className="error-message" style={{ 
            padding: '40px', 
            textAlign: 'center',
            background: 'var(--card-bg, #fff)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginTop: '40px'
          }}>
            <h2 style={{ color: isClosedError ? '#e74c3c' : isVipError ? '#ffc107' : '#2c3e50', marginBottom: '20px' }}>
              {isClosedError ? '🔒 Truyện đã bị đóng' : isVipError ? '⭐ Truyện VIP' : '❌ Lỗi'}
            </h2>
            <p style={{ color: '#7f8c8d', fontSize: '16px', marginBottom: '20px' }}>
              {error || 'Không tìm thấy truyện'}
            </p>
            {isVipError && (
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '2px solid #ffc107'
              }}>
                <p style={{ color: '#ffc107', fontSize: '16px', marginBottom: '10px', fontWeight: '600' }}>
                  ⭐ Truyện này chỉ dành cho thành viên VIP
                </p>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '0' }}>
                  Vui lòng nâng cấp tài khoản VIP để đọc truyện này và nhiều nội dung độc quyền khác.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const firstChapter = comic.chapters && comic.chapters.length > 0 ? comic.chapters[0] : null;

  return (
    <div className="comic-detail">
      <div className="container">
        {/* Table 1: Thông tin truyện */}
        <div className="comic-info-section">
          <div className="comic-cover-large">
            <img 
              src={getImageUrl(comic.cover_image) || IMAGE_PLACEHOLDER} 
              alt={comic.title}
              onError={(e) => {
                e.target.src = IMAGE_PLACEHOLDER;
              }}
            />
          </div>
          <div className="comic-info-content">
            <h1 className="comic-title-large">{comic.title}</h1>
            <div className="comic-meta-grid">
              <div className="meta-item">
                <span className="meta-icon">👤</span>
                <span className="meta-label">Tác giả:</span>
                <span className="meta-value">{comic.author || 'Chưa rõ'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🎨</span>
                <span className="meta-label">Họa sĩ:</span>
                <span className="meta-value">{comic.artist || 'Chưa rõ'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🔞</span>
                <span className="meta-label">Xếp hạng:</span>
                <span className="meta-value">{comic.rating || 'Chưa rõ'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🏢</span>
                <span className="meta-label">Nội dung bởi:</span>
                <span className="meta-value">{comic.content_by || 'Chưa rõ'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📡</span>
                <span className="meta-label">Tình trạng:</span>
                <span className="meta-value">
                  <span className={`status-badge ${comic.status}`}>
                    {COMIC_STATUS_LABELS[comic.status] || comic.status}
                  </span>
                  {comic.access_status === 'vip' && (
                    <span className="vip-badge" style={{ marginLeft: '8px' }}>VIP</span>
                  )}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👍</span>
                <span className="meta-label">Lượt thích:</span>
                <span className="meta-value">{comic.likes || 0}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">❤️</span>
                <span className="meta-label">Lượt theo dõi:</span>
                <span className="meta-value">{comic.follows || 0}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👁</span>
                <span className="meta-label">Lượt xem:</span>
                <span className="meta-value">{comic.views || 0}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🏷️</span>
                <span className="meta-label">Thể loại:</span>
                <span className="meta-value">
                  <div className="categories-list">
                    {comic.categories && comic.categories.length > 0 ? (
                      comic.categories.map(cat => (
                        <Link key={cat.id} to={`/category/${cat.id}`} className="category-tag">
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <span>Chưa có</span>
                    )}
                  </div>
                </span>
              </div>
            </div>
            <div className="action-buttons">
              <button 
                onClick={handleReadFromStart} 
                className="btn-action btn-primary"
                disabled={!firstChapter}
              >
                Đọc từ đầu
              </button>
              <button 
                onClick={handleFavorite} 
                className={`btn-action ${isFavorite ? 'btn-favorite active' : 'btn-favorite'}`}
                disabled={loadingAction || !isAuthenticated}
              >
                {isFavorite ? '✓ Đã theo dõi' : 'Theo dõi'}
              </button>
              <button 
                onClick={handleLike} 
                className={`btn-action ${isLiked ? 'btn-like active' : 'btn-like'}`}
                disabled={loadingAction || !isAuthenticated}
              >
                {isLiked ? '❤️ Đã thích' : '🤍 Thích'}
              </button>
              {isAuthenticated && (
                <button 
                  onClick={handleContinueReading} 
                  className="btn-action btn-continue"
                  disabled={!firstChapter}
                >
                  {lastReadChapter ? `Đọc tiếp Chương ${lastReadChapter.chapter_number}` : 'Đọc từ đầu'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table 2: Giới thiệu */}
          <div className="comic-description-section">
          <div className="description-header">
            <h2>Giới thiệu</h2>
            <button 
              className="btn-ai-summarize"
              onClick={handleSummarizeComic}
              disabled={loadingSummary}
            >
              {loadingSummary ? '⏳ Đang tạo tóm tắt...' : '🤖 Tóm tắt truyện bằng AI'}
            </button>
          </div>
          {showSummary && aiSummary ? (
            <div className="ai-summary-box">
              <h3>Tóm tắt bằng AI</h3>
              <div className="ai-summary-content">
                {aiSummary.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index}>{paragraph.trim()}</p>
                  )
                ))}
              </div>
              <button 
                className="btn-close-summary"
                onClick={() => setShowSummary(false)}
              >
                Ẩn tóm tắt AI
              </button>
            </div>
          ) : comic.description ? (
            <p>{comic.description}</p>
          ) : (
            <p className="no-description">Chưa có mô tả cho truyện này.</p>
          )}
          </div>

        {/* Table 3: Danh sách chương */}
        <div className="chapters-section">
          <h2>Danh sách chương</h2>
          <div className="chapters-list">
            {comic.chapters && comic.chapters.length > 0 ? (
              comic.chapters.map((chapter) => {
                const isClosed = chapter.status === 'closed';
                const isVip = chapter.status === 'vip';
                const isAdmin = user?.role === 'admin';
                const userIsVip = user && (user.role === 'vip' || user.role === 'admin');
                const canView = (!isClosed && !isVip) || (isVip && userIsVip) || isAdmin;
                
                return (
                  <div 
                    key={chapter.id} 
                    className={`chapter-item ${isClosed && !isAdmin ? 'chapter-closed' : ''} ${isVip && !userIsVip ? 'chapter-vip-locked' : ''}`}
                    style={!canView ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                    {canView ? (
                      <Link 
                        to={`/chapter/${chapter.id}`}
                        onClick={async (e) => {
                          if (isVip && !userIsVip) {
                            e.preventDefault();
                            alert('Chương này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.');
                            return;
                          }
                          if (isAuthenticated) {
                            try {
                              await addReadingHistory(id, chapter.id);
                            } catch (err) {
                              console.error('Error adding reading history:', err);
                            }
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                      >
                        <span className="chapter-number">Chương {chapter.chapter_number}</span>
                        {chapter.title && <span className="chapter-title">: {chapter.title}</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isVip && (
                            <span className="vip-badge" style={{
                              padding: '2px 8px',
                              background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                              color: '#fff',
                              borderRadius: '3px',
                              fontSize: '12px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              boxShadow: '0 2px 4px rgba(255, 193, 7, 0.4)'
                            }}>
                              VIP
                            </span>
                          )}
                          {isClosed && isAdmin && (
                            <span className="chapter-status-badge" style={{
                              padding: '2px 8px',
                              background: '#e74c3c',
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '12px'
                            }}>
                              Đóng
                            </span>
                          )}
                          <span className="chapter-date">
                            {formatDate(chapter.created_at)}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div 
                        style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                        onClick={() => {
                          if (isVip && !userIsVip) {
                            alert('Chương này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.');
                          }
                        }}
                      >
                        <span className="chapter-number">Chương {chapter.chapter_number}</span>
                        {chapter.title && <span className="chapter-title">: {chapter.title}</span>}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isVip && (
                            <span className="vip-badge" style={{
                              padding: '2px 8px',
                              background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                              color: '#fff',
                              borderRadius: '3px',
                              fontSize: '12px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              boxShadow: '0 2px 4px rgba(255, 193, 7, 0.4)'
                            }}>
                              VIP
                            </span>
                          )}
                          {isClosed && (
                            <span className="chapter-status-badge" style={{
                              padding: '2px 8px',
                              background: '#e74c3c',
                              color: 'white',
                              borderRadius: '3px',
                              fontSize: '12px'
                            }}>
                              Đóng
                            </span>
                          )}
                          <span className="chapter-date">
                            {formatDate(chapter.created_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="no-chapters">Chưa có chương nào</p>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection comicId={id} type="comic" />
      </div>
    </div>
  );
};

export default ComicDetail;
