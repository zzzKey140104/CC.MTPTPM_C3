import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useChapter } from '../hooks/useChapter';
import { useAuth } from '../contexts/AuthContext';
import { addReadingHistory, getChaptersByComicId, summarizeChapter, getChapterAudio, createChapterAudio } from '../services/api';
import Loading from '../components/common/Loading';
import CommentsSection from '../components/features/CommentsSection';
import { formatDate, getImageUrl } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import './ChapterReader.css';

const ChapterReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { chapter, loading, error } = useChapter(id);
  const { isAuthenticated, user } = useAuth();
  const userIsVip = user && (user.role === 'vip' || user.role === 'admin');
  const contentRef = useRef(null);
  const scrollSaved = useRef(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [readMode, setReadMode] = useState('images');
  
  // Audio states
  const [chapterAudio, setChapterAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [creatingAudio, setCreatingAudio] = useState(false);

  const audioRef = useRef(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  // Audio sync states
  const [textParagraphs, setTextParagraphs] = useState([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(-1);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const paragraphRefs = useRef([]);
  const imageRefs = useRef([]);

  // Parse images from chapter data
  const images = React.useMemo(() => {
    if (!chapter?.images) return [];

    if (typeof chapter.images === 'string') {
      try {
        const parsed = JSON.parse(chapter.images);
        return Array.isArray(parsed) ? parsed.filter(img => img && img.trim()) : [];
      } catch (e) {
        console.error('Error parsing images:', e, 'Raw images:', chapter.images);
        return [];
      }
    } else if (Array.isArray(chapter.images)) {
      return chapter.images.filter(img => img && img.trim());
    }
    return [];
  }, [chapter?.images]);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Lưu scroll position vào localStorage
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        localStorage.setItem(`chapter_${id}_scroll`, scrollPosition.toString());
      }
    };

    // Throttle scroll event để không gọi quá nhiều
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [id]);

  // Khôi phục scroll position khi load chapter
  useEffect(() => {
    if (chapter && !loading && !scrollSaved.current) {
      const savedScroll = localStorage.getItem(`chapter_${id}_scroll`);
      if (savedScroll) {
        // Đợi DOM render và images load
        setTimeout(() => {
          const imageElements = document.querySelectorAll('.chapter-page');
          if (imageElements.length > 0) {
            // Đợi ít nhất một số images load
            let loadedCount = 0;
            const totalImages = imageElements.length;
            const minLoad = Math.min(5, totalImages); // Load ít nhất 5 ảnh đầu hoặc tất cả
            
            const checkAllLoaded = () => {
              loadedCount++;
              if (loadedCount >= minLoad) {
                setTimeout(() => {
                  window.scrollTo({
                    top: parseInt(savedScroll, 10),
                    behavior: 'smooth'
                  });
                  scrollSaved.current = true;
                }, 200);
              }
            };

            imageElements.forEach((img) => {
              if (img.complete) {
                checkAllLoaded();
              } else {
                img.onload = checkAllLoaded;
                img.onerror = checkAllLoaded;
              }
            });

            // Fallback: scroll sau 1.5 giây nếu chưa load đủ
            setTimeout(() => {
              if (!scrollSaved.current) {
                window.scrollTo({
                  top: parseInt(savedScroll, 10),
                  behavior: 'smooth'
                });
                scrollSaved.current = true;
              }
            }, 1500);
          } else {
            // Nếu không có images, scroll ngay
            window.scrollTo({
              top: parseInt(savedScroll, 10),
              behavior: 'smooth'
            });
            scrollSaved.current = true;
          }
        }, 100);
      } else {
        scrollSaved.current = true; // Đánh dấu đã xử lý
      }
    }
  }, [chapter, loading, id]);

  useEffect(() => {
    if (chapter && isAuthenticated && chapter.comic?.id) {
      addReadingHistory(chapter.comic.id, id).catch(err => {
        console.error('Error adding reading history:', err);
      });
    }
  }, [chapter, isAuthenticated, id]);

  // Parse text content into paragraphs when chapter loads
  useEffect(() => {
    if (chapter && chapter.content) {
      const content = chapter.content.toString();
      const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
      setTextParagraphs(paragraphs);
      paragraphRefs.current = paragraphs.map(() => React.createRef());
    }
  }, [chapter]);

  // Initialize image refs when images change
  useEffect(() => {
    if (images.length > 0) {
      imageRefs.current = images.map(() => React.createRef());
    }
  }, [images]);



  const handleCreateAudio = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để tạo audio');
      return;
    }

    try {
      setCreatingAudio(true);
      const response = await createChapterAudio(id, {
        voice: 'vi-VN-HonMyBellNeural',
        rate: '+10%'
      });

      if (response.data.success) {
        setChapterAudio(response.data.audio);
        setShowAudioPlayer(true);
        alert('Tạo audio thành công! Bạn có thể nghe chương ngay bây giờ.');
      }
    } catch (error) {
      console.error('Error creating chapter audio:', error);
      alert('Lỗi khi tạo audio: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreatingAudio(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipToNext = () => {
    if (!audioRef.current || !chapterAudio) return;

    const audio = audioRef.current;
    const duration = chapterAudio.duration || audio.duration;

    if (readMode === 'text' && textParagraphs.length > 0) {
      const nextIndex = Math.min(currentParagraphIndex + 1, textParagraphs.length - 1);
      const totalChars = textParagraphs.reduce((sum, p) => sum + p.length, 0);
      let cumulativeChars = 0;

      for (let i = 0; i <= nextIndex; i++) {
        cumulativeChars += textParagraphs[i].length;
      }

      const targetTime = (cumulativeChars / totalChars) * duration;
      audio.currentTime = Math.max(0, targetTime - 1); // Start 1 second before
    } else if (readMode === 'images' && images.length > 0) {
      const nextIndex = Math.min(currentImageIndex + 1, images.length - 1);
      const targetTime = ((nextIndex + 1) / images.length) * duration;
      audio.currentTime = Math.max(0, targetTime - 1);
    }
  };

  const skipToPrev = () => {
    if (!audioRef.current || !chapterAudio) return;

    const audio = audioRef.current;
    const duration = chapterAudio.duration || audio.duration;

    if (readMode === 'text' && textParagraphs.length > 0) {
      const prevIndex = Math.max(currentParagraphIndex - 1, 0);
      const totalChars = textParagraphs.reduce((sum, p) => sum + p.length, 0);
      let cumulativeChars = 0;

      for (let i = 0; i < prevIndex; i++) {
        cumulativeChars += textParagraphs[i].length;
      }

      const targetTime = (cumulativeChars / totalChars) * duration;
      audio.currentTime = targetTime;
    } else if (readMode === 'images' && images.length > 0) {
      const prevIndex = Math.max(currentImageIndex - 1, 0);
      const targetTime = (prevIndex / images.length) * duration;
      audio.currentTime = targetTime;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentParagraphIndex(-1);
    setCurrentImageIndex(-1);
  };

  // Audio sync: track current time and scroll to corresponding content
  useEffect(() => {
    if (!audioRef.current || !chapterAudio) return;

    const audio = audioRef.current;
    const duration = chapterAudio.duration || audio.duration;

    if (!duration) return;

    const updateCurrentContent = () => {
      const currentTime = audio.currentTime;

      if (readMode === 'text' && textParagraphs.length > 0) {
        // Sync for text mode
        const totalChars = textParagraphs.reduce((sum, p) => sum + p.length, 0);
        let cumulativeChars = 0;
        let targetIndex = -1;

        for (let i = 0; i < textParagraphs.length; i++) {
          cumulativeChars += textParagraphs[i].length;
          const paragraphStartTime = (cumulativeChars - textParagraphs[i].length) / totalChars * duration;
          const paragraphEndTime = cumulativeChars / totalChars * duration;

          if (currentTime >= paragraphStartTime && currentTime <= paragraphEndTime) {
            targetIndex = i;
            break;
          }
        }

        if (targetIndex !== currentParagraphIndex) {
          setCurrentParagraphIndex(targetIndex);
          setCurrentImageIndex(-1); // Reset image index

          // Scroll to the paragraph if it's different and not visible
          if (targetIndex >= 0 && paragraphRefs.current[targetIndex]?.current) {
            const element = paragraphRefs.current[targetIndex].current;
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

            if (!isVisible) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }
        }
      } else if (readMode === 'images' && images.length > 0) {
        // Sync for images mode
        const targetIndex = Math.floor((currentTime / duration) * images.length);

        if (targetIndex !== currentImageIndex && targetIndex < images.length) {
          setCurrentImageIndex(targetIndex);
          setCurrentParagraphIndex(-1); // Reset paragraph index

          // Scroll to the image if it's different and not visible
          if (imageRefs.current[targetIndex]?.current) {
            const element = imageRefs.current[targetIndex].current;
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

            if (!isVisible) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }
        }
      }
    };

    const handleTimeUpdate = () => {
      updateCurrentContent();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [chapterAudio, textParagraphs, currentParagraphIndex, currentImageIndex, readMode, images]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!chapter) return;
    if (chapter.images && Array.isArray(chapter.images) && chapter.images.length > 0) {
      setReadMode('images');
    } else {
      setReadMode('text');
    }
  }, [chapter]);

  // Load danh sách chương khi mở dropdown
  // Reset chapters khi chuyển chapter
  useEffect(() => {
    setChapters([]);
    setShowChapterList(false);
  }, [id]);

  useEffect(() => {
    if (showChapterList && chapter?.comic?.id && chapters.length === 0) {
      const fetchChapters = async () => {
        try {
          setLoadingChapters(true);
          const response = await getChaptersByComicId(chapter.comic.id);
          if (response.data.success) {
            const chaptersData = Array.isArray(response.data.data)
              ? response.data.data
              : (response.data.data?.chapters || []);
            // Sắp xếp theo chapter_number
            const sortedChapters = chaptersData.sort((a, b) => a.chapter_number - b.chapter_number);
            setChapters(sortedChapters);
          }
        } catch (err) {
          console.error('Error fetching chapters:', err);
        } finally {
          setLoadingChapters(false);
        }
      };
      fetchChapters();
    }
  }, [showChapterList, chapter?.comic?.id, chapters.length]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showChapterList && !event.target.closest('.navbar-chapter-dropdown')) {
        setShowChapterList(false);
      }
    };

    if (showChapterList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showChapterList]);

  if (loading) {
    return <Loading />;
  }

  if (error || !chapter) {
    const isClosedError = error && (error.includes('đóng') || error.includes('closed'));
    const isVipError = error && (error.includes('VIP') || error.includes('vip'));
    return (
      <div className="chapter-reader">
        <div className="container">
          <div className="error-message" style={{ 
            padding: '40px', 
            textAlign: 'center',
            background: 'var(--card-bg, #fff)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginTop: '40px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              {isClosedError ? '🔒' : isVipError ? '⭐' : '❌'}
            </div>
            <h2 style={{ color: isClosedError ? '#e74c3c' : isVipError ? '#ffc107' : '#2c3e50', marginBottom: '20px', fontSize: '28px' }}>
              {isClosedError ? 'Chương đã bị đóng' : isVipError ? 'Chương VIP' : 'Lỗi'}
            </h2>
            <p style={{ color: '#7f8c8d', fontSize: '16px', marginBottom: '20px', lineHeight: '1.6' }}>
              {error || 'Không tìm thấy chương'}
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
                  Vui lòng nâng cấp tài khoản VIP để đọc chương này và nhiều nội dung độc quyền khác.
                </p>
              </div>
            )}
            {chapter?.comic?.id && (
              <Link 
                to={`/comic/${chapter.comic.id}`}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'var(--primary-color, #667eea)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
              >
                ← Về trang truyện
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }



  const hasTextContent = chapter.content && chapter.content.toString().trim() !== '';
  const canShowText = hasTextContent;
  const canShowImages = images.length > 0;
  const displayMode = canShowImages && readMode === 'images' ? 'images' : 'text';
  
  // Debug log
  if (images.length === 0 && chapter.images) {
    console.warn('No images found. Chapter images data:', chapter.images);
  }
  
  const chapterDate = chapter.created_at ? formatDate(chapter.created_at) : '';

  return (
    <div className="chapter-reader">
      <div className="container">
        {/* Tiêu đề */}
        <div className="chapter-header">
          <Link to={`/comic/${chapter.comic?.id}`} className="back-link">
            ← Về trang truyện
          </Link>
          <div className="chapter-title-section">
            <h1 className="chapter-title">
              {chapter.comic?.title} - Chương {chapter.chapter_number}
              {chapter.title && `: ${chapter.title}`}
            </h1>
            {chapterDate && (
              <p className="chapter-date">Ngày đăng: {chapterDate}</p>
            )}
          </div>
        </div>

        {/* Navigation top */}
        <div className="chapter-navigation">
          {chapter.prevChapter ? (
            <Link to={`/chapter/${chapter.prevChapter.id}`} className="nav-btn prev">
              ← Chương trước
            </Link>
          ) : (
            <span className="nav-btn disabled">← Chương trước</span>
          )}
          
          <Link to={`/comic/${chapter.comic?.id}`} className="nav-btn back">
            Danh sách chương
          </Link>
          
          {chapter.nextChapter ? (
            <Link to={`/chapter/${chapter.nextChapter.id}`} className="nav-btn next">
              Chương sau →
            </Link>
          ) : (
            <span className="nav-btn disabled">Chương sau →</span>
          )}
        </div>

        {/* Audio Player Section */}
        <AnimatePresence>
          {showAudioPlayer && chapterAudio && chapterAudio.audio_url && (
            <motion.div
              className="chapter-audio-section"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="audio-player-container">
                <div className="audio-player-header">
                  <span className="audio-icon">🎧</span>
                  <span className="audio-title">Audio Chương</span>
                  {chapterAudio.duration && (
                    <span className="audio-duration">({formatDuration(chapterAudio.duration)})</span>
                  )}
                </div>
                <div className="audio-player-controls">
                  <audio
                    ref={audioRef}
                    src={chapterAudio.audio_url}
                    onEnded={handleAudioEnded}
                    onError={(e) => {
                      console.error('Audio playback error:', e);
                      alert('Không thể phát audio');
                    }}
                  />

                  {/* Skip Controls */}
                  <div className="audio-skip-controls">
                    <button
                      className="audio-btn audio-btn-skip"
                      onClick={skipToPrev}
                      title="Đoạn trước"
                      disabled={!chapterAudio}
                    >
                      ⏮️
                    </button>
                    <button
                      className={`audio-btn ${isPlaying ? 'playing' : ''}`}
                      onClick={togglePlayPause}
                      title={isPlaying ? 'Tạm dừng' : 'Phát audio'}
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </button>
                    <button
                      className="audio-btn audio-btn-skip"
                      onClick={skipToNext}
                      title="Đoạn sau"
                      disabled={!chapterAudio}
                    >
                      ⏭️
                    </button>
                  </div>

                  {/* Progress Info */}
                  <div className="audio-progress-info">
                    {readMode === 'text' && textParagraphs.length > 0 && (
                      <div className="progress-text">
                        <span>Đoạn: {currentParagraphIndex >= 0 ? currentParagraphIndex + 1 : 0}/{textParagraphs.length}</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${textParagraphs.length > 0 ? ((currentParagraphIndex + 1) / textParagraphs.length) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {readMode === 'images' && images.length > 0 && (
                      <div className="progress-text">
                        <span>Trang: {currentImageIndex >= 0 ? currentImageIndex + 1 : 0}/{images.length}</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${images.length > 0 ? ((currentImageIndex + 1) / images.length) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="audio-btn-close"
                    onClick={() => setShowAudioPlayer(false)}
                    title="Ẩn audio player"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Create Button (when no audio exists) */}
        {!chapterAudio && !loadingAudio && (
          <div className="chapter-audio-create-section">
            <button 
              className="btn-create-audio"
              onClick={handleCreateAudio}
              disabled={creatingAudio}
            >
              {creatingAudio ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  Đang tạo audio...
                </>
              ) : (
                <>
                  🎧 Tạo Audio Chương
                </>
              )}
            </button>
            <p className="audio-hint">
              Tạo audio từ hình ảnh truyện bằng AI (OCR + TTS)
            </p>
          </div>
        )}

        {/* Loading Audio State */}
        {loadingAudio && (
          <div className="chapter-audio-loading">
            <span>⏳ Đang kiểm tra audio...</span>
          </div>
        )}

        {/* AI Summary Section */}
        <div className="chapter-ai-summary-section">
          <button 
            className="btn-ai-summarize-chapter"
            onClick={async () => {
              if (!chapter) return;
              try {
                setLoadingSummary(true);
                const response = await summarizeChapter(id);
                if (response.data.success) {
                  setAiSummary(response.data.data.summary);
                  setShowSummary(true);
                } else {
                  alert('Lỗi khi tạo tóm tắt: ' + (response.data.message || 'Vui lòng thử lại'));
                }
              } catch (error) {
                console.error('Error summarizing chapter:', error);
                alert('Lỗi khi tạo tóm tắt. Vui lòng thử lại sau.');
              } finally {
                setLoadingSummary(false);
              }
            }}
            disabled={loadingSummary}
          >
            {loadingSummary ? '⏳ Đang phân tích chương bằng AI...' : '🤖 Tóm tắt chương bằng AI'}
          </button>
          
          {showSummary && aiSummary && (
            <div className="chapter-ai-summary-box">
              <h3>Tóm tắt chương bằng AI</h3>
              <div className="chapter-ai-summary-content">
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
          )}
        </div>

        {canShowImages && canShowText && (
          <div className="chapter-reader-mode-toggle">
            <button
              type="button"
              className={readMode === 'images' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => setReadMode('images')}
            >
              📷 Đọc theo ảnh
            </button>
            <button
              type="button"
              className={readMode === 'text' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => setReadMode('text')}
            >
              📝 Đọc theo văn bản
            </button>
          </div>
        )}

        {/* Nội dung chương */}
        <div className="chapter-content" ref={contentRef}>
          {displayMode === 'images' && images.length > 0 ? (
            images.map((image, index) => {
              if (!image || typeof image !== 'string') {
                console.warn(`Invalid image at index ${index}:`, image);
                return null;
              }

              const imageUrl = getImageUrl(image);
              if (!imageUrl) {
                console.warn(`Failed to generate URL for image:`, image);
                return null;
              }

              const isCurrentImage = index === currentImageIndex;

              return (
                <motion.div
                  key={index}
                  ref={imageRefs.current[index]}
                  className={`chapter-page-wrapper ${isCurrentImage ? 'current-audio-page' : ''}`}
                  initial={{ opacity: 0.8 }}
                  animate={{
                    opacity: isCurrentImage ? 1 : 0.8,
                    scale: isCurrentImage ? 1.02 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="chapter-page-number">
                    Trang {index + 1}
                    {isCurrentImage && <span className="audio-indicator">🎧</span>}
                  </div>
                  <img
                    src={imageUrl}
                    alt={`Page ${index + 1}`}
                    className="chapter-page"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Failed to load image:', imageUrl, 'Original path:', image);
                      e.target.src = 'https://via.placeholder.com/800x1200?text=Image+Not+Found';
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded image:', imageUrl);
                    }}
                  />
                </motion.div>
              );
            }).filter(Boolean) // Lọc bỏ null
          ) : displayMode === 'text' && canShowText ? (
            <div className="chapter-text-content">
              {textParagraphs.map((paragraph, index) => {
                const isCurrentParagraph = index === currentParagraphIndex;
                return (
                  <motion.p
                    key={index}
                    ref={paragraphRefs.current[index]}
                    className={`chapter-paragraph ${isCurrentParagraph ? 'current-audio-paragraph' : ''}`}
                    initial={{ opacity: 0.8 }}
                    animate={{
                      opacity: isCurrentParagraph ? 1 : 0.8,
                      x: isCurrentParagraph ? 10 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {paragraph.trim()}
                    {isCurrentParagraph && <span className="audio-indicator"> 🎧</span>}
                  </motion.p>
                );
              })}
            </div>
          ) : (
            <div className="no-content">
              <p>Chưa có nội dung cho chương này</p>
              {process.env.NODE_ENV === 'development' && (
                <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px', fontSize: '12px' }}>
                  <p><strong>Debug Info:</strong></p>
                  <p>Chapter ID: {chapter.id}</p>
                  <p>Images type: {typeof chapter.images}</p>
                  <p>Images value: {JSON.stringify(chapter.images)}</p>
                  <p>Parsed images count: {images.length}</p>
                  <p>Has text content: {hasTextContent ? 'yes' : 'no'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation bottom */}
        <div className="chapter-navigation bottom">
          {chapter.prevChapter ? (
            <Link to={`/chapter/${chapter.prevChapter.id}`} className="nav-btn prev">
              ← Chương trước
            </Link>
          ) : (
            <span className="nav-btn disabled">← Chương trước</span>
          )}
          
          <Link to={`/comic/${chapter.comic?.id}`} className="nav-btn back">
            Danh sách chương
          </Link>
          
          {chapter.nextChapter ? (
            <Link to={`/chapter/${chapter.nextChapter.id}`} className="nav-btn next">
              Chương sau →
            </Link>
          ) : (
            <span className="nav-btn disabled">Chương sau →</span>
          )}
        </div>

        {/* Comments Section */}
        <CommentsSection chapterId={id} type="chapter" />
      </div>

      {/* Sticky Bottom Navbar */}
      <div className="chapter-reader-navbar">
        <button 
          className="navbar-btn" 
          onClick={() => navigate('/')}
          title="Trang chủ"
        >
          🏠
        </button>

        <button
          className="navbar-btn"
          onClick={handleScrollToTop}
          title="Lên đầu trang"
        >
          ⬆️
        </button>
        
        {chapter.prevChapter ? (
          <Link 
            to={`/chapter/${chapter.prevChapter.id}`} 
            className="navbar-btn"
            title="Chương trước"
          >
            ⬅️
          </Link>
        ) : (
          <span className="navbar-btn disabled" title="Chương trước">
            ⬅️
          </span>
        )}

        <div className="navbar-chapter-dropdown">
          <button 
            className="navbar-btn current-chapter"
            onClick={() => setShowChapterList(!showChapterList)}
            title="Chương đang đọc"
          >
            📖 Chương {chapter.chapter_number}
          </button>
          
          {showChapterList && (
            <div className="chapter-list-dropdown">
              <div className="chapter-list-header">
                <span>Danh sách chương</span>
                <button 
                  className="close-btn"
                  onClick={() => setShowChapterList(false)}
                >
                  ✕
                </button>
              </div>
              <div className="chapter-list-content">
                {loadingChapters ? (
                  <div className="loading-chapters">Đang tải...</div>
                ) : (
                  chapters.map((ch) => {
                    const isClosed = ch.status === 'closed';
                    const isVip = ch.status === 'vip';
                    const isAdmin = user?.role === 'admin';
                    const canView = (!isClosed && !isVip) || (isVip && userIsVip) || isAdmin;
                    
                    if (!canView && !isVip) {
                      return null; // Ẩn chương đã đóng đối với user thường
                    }
                    
                    return (
                      <Link
                        key={ch.id}
                        to={`/chapter/${ch.id}`}
                        className={`chapter-list-item ${ch.id === parseInt(id) ? 'active' : ''} ${isClosed ? 'chapter-closed' : ''} ${isVip && !userIsVip ? 'chapter-vip-locked' : ''}`}
                        onClick={(e) => {
                          if (isVip && !userIsVip) {
                            e.preventDefault();
                            alert('Chương này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.');
                            return;
                          }
                          setShowChapterList(false);
                        }}
                      >
                        Chương {ch.chapter_number}
                        {ch.title && `: ${ch.title}`}
                        {isVip && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                            color: '#fff',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 4px rgba(255, 193, 7, 0.4)'
                          }}>
                            VIP
                          </span>
                        )}
                        {isClosed && isAdmin && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            background: '#e74c3c',
                            color: 'white',
                            borderRadius: '3px',
                            fontSize: '10px'
                          }}>
                            Đóng
                          </span>
                        )}
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {chapter.nextChapter ? (
          <Link 
            to={`/chapter/${chapter.nextChapter.id}`} 
            className="navbar-btn"
            title="Chương tiếp theo"
          >
            ➡️
          </Link>
        ) : (
          <span className="navbar-btn disabled" title="Chương tiếp theo">
            ➡️
          </span>
        )}
      </div>
    </div>
  );
};

export default ChapterReader;

