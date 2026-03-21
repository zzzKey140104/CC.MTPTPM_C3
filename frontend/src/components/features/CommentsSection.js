import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getCommentsByComicId, 
  getCommentsByChapterId, 
  createComment, 
  toggleCommentLike,
  checkCommentLike 
} from '../../services/api';
import { getImageUrl } from '../../utils/helpers';
import './CommentsSection.css';

const CommentsSection = ({ comicId, chapterId, type = 'comic' }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReply, setShowReply] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('popular');
  const [likedComments, setLikedComments] = useState(new Set());

  const loadComments = useCallback(async () => {
    if ((type === 'comic' && !comicId) || (type === 'chapter' && !chapterId)) {
      return;
    }

    try {
      setLoading(true);
      const params = { page, limit: 5, sort };
      const response = type === 'comic' 
        ? await getCommentsByComicId(comicId, params)
        : await getCommentsByChapterId(chapterId, params);

      console.log('=== Comments API Debug ===');
      console.log('Full response:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.data:', response.data?.data);
      console.log('Type of response.data.data:', typeof response.data?.data);
      console.log('Is array?', Array.isArray(response.data?.data));

      if (response.data && response.data.success) {
        // Response structure từ backend: 
        // { success: true, message: '...', data: { data: [...], pagination: {...} } }
        const responseData = response.data.data;
        
        // Kiểm tra nhiều trường hợp để đảm bảo lấy đúng data
        let commentsData = [];
        let total = 0;
        let totalPages = 1;
        
        if (Array.isArray(responseData)) {
          // Trường hợp 1: responseData là array trực tiếp
          console.log('Case 1: responseData is array directly');
          commentsData = responseData;
        } else if (responseData && typeof responseData === 'object') {
          // Trường hợp 2: responseData là object có property data và pagination
          if (Array.isArray(responseData.data)) {
            console.log('Case 2: responseData.data is array');
            commentsData = responseData.data;
            total = responseData.pagination?.total || 0;
            totalPages = responseData.pagination?.totalPages || 1;
          } else {
            console.log('Case 3: responseData is object but data is not array');
            console.log('responseData keys:', Object.keys(responseData));
          }
        }
        
        console.log('Final commentsData:', commentsData);
        console.log('Comments count:', commentsData.length);
        console.log('Total:', total);
        console.log('Total pages:', totalPages);
        
        setComments(commentsData);
        setTotalComments(total);
        setTotalPages(totalPages);

        // Load like status for each comment
        if (isAuthenticated && commentsData.length > 0) {
          const likedSet = new Set();
          for (let comment of commentsData) {
            try {
              const likeResponse = await checkCommentLike(comment.id);
              if (likeResponse.data.success && likeResponse.data.data.isLiked) {
                likedSet.add(comment.id);
              }
              // Check likes for replies
              if (comment.replies) {
                for (let reply of comment.replies) {
                  try {
                    const replyLikeResponse = await checkCommentLike(reply.id);
                    if (replyLikeResponse.data.success && replyLikeResponse.data.data.isLiked) {
                      likedSet.add(reply.id);
                    }
                  } catch (err) {
                    console.error('Error checking reply like:', err);
                  }
                }
              }
            } catch (err) {
              console.error('Error checking comment like:', err);
            }
          }
          setLikedComments(likedSet);
        }
      } else {
        // Nếu response không thành công, set comments là array rỗng
        setComments([]);
        setTotalComments(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      console.error('Error details:', err.response?.data || err.message);
      // Đảm bảo comments luôn là array ngay cả khi có lỗi
      setComments([]);
      setTotalComments(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [comicId, chapterId, page, sort, type, isAuthenticated]);

  useEffect(() => {
    if ((type === 'comic' && comicId) || (type === 'chapter' && chapterId)) {
      loadComments();
    }
  }, [comicId, chapterId, page, sort, type, loadComments]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const response = await createComment({
        [type === 'comic' ? 'comic_id' : 'chapter_id']: type === 'comic' ? comicId : chapterId,
        content: commentText.trim()
      });

      if (response.data.success) {
        setCommentText('');
        loadComments();
      }
    } catch (err) {
      console.error('Error creating comment:', err);
      alert('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId) => {
    const text = replyText[parentId];
    if (!text || !text.trim()) return;

    try {
      setSubmitting(true);
      const response = await createComment({
        [type === 'comic' ? 'comic_id' : 'chapter_id']: type === 'comic' ? comicId : chapterId,
        parent_id: parentId,
        content: text.trim()
      });

      if (response.data.success) {
        setReplyText({ ...replyText, [parentId]: '' });
        setShowReply({ ...showReply, [parentId]: false });
        loadComments();
      }
    } catch (err) {
      console.error('Error creating reply:', err);
      alert('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thích bình luận');
      return;
    }

    try {
      const response = await toggleCommentLike(commentId);
      if (response.data.success) {
        const newLiked = new Set(likedComments);
        if (response.data.data.liked) {
          newLiked.add(commentId);
        } else {
          newLiked.delete(commentId);
        }
        setLikedComments(newLiked);
        loadComments();
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <span className="comment-icon">💬</span>
        <h3 className="comments-title">Bình luận</h3>
        <span className="comments-count">({totalComments})</span>
      </div>

      <p className="comments-subtitle">Like và theo dõi để ủng hộ truyện GG</p>

      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            className="comment-input"
            placeholder="Nhập bình luận của bạn..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
          />
          <button 
            type="submit" 
            className="comment-submit-btn"
            disabled={submitting || !commentText.trim()}
          >
            Gửi
          </button>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <p>Vui lòng đăng nhập để bình luận</p>
        </div>
      )}

      <div className="comments-sort">
        <button
          className={`sort-btn ${sort === 'popular' ? 'active' : ''}`}
          onClick={() => { setSort('popular'); setPage(1); }}
        >
          Nhiều thích nhất
        </button>
        <button
          className={`sort-btn ${sort === 'newest' ? 'active' : ''}`}
          onClick={() => { setSort('newest'); setPage(1); }}
        >
          Mới nhất
        </button>
      </div>

      {loading ? (
        <div className="comments-loading">Đang tải bình luận...</div>
      ) : !Array.isArray(comments) ? (
        <div className="no-comments">Đang tải bình luận...</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</div>
      ) : (
        <>
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  <img 
                    src={comment.avatar ? getImageUrl(comment.avatar) : '/default-avatar.png'} 
                    alt={comment.username}
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                  />
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">{comment.username}</span>
                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                  </div>
                  <div className="comment-text">{comment.content}</div>
                  <div className="comment-actions">
                    <button
                      className={`like-btn ${likedComments.has(comment.id) ? 'liked' : ''}`}
                      onClick={() => handleLike(comment.id)}
                    >
                      👍 {comment.likes_count || 0}
                    </button>
                    <button
                      className="reply-btn"
                      onClick={() => setShowReply({ ...showReply, [comment.id]: !showReply[comment.id] })}
                    >
                      Trả lời
                    </button>
                  </div>

                  {showReply[comment.id] && isAuthenticated && (
                    <div className="reply-form">
                      <textarea
                        className="reply-input"
                        placeholder="Nhập phản hồi..."
                        value={replyText[comment.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                        rows={2}
                      />
                      <div className="reply-actions">
                        <button
                          className="reply-submit-btn"
                          onClick={() => handleReply(comment.id)}
                          disabled={submitting || !replyText[comment.id]?.trim()}
                        >
                          Gửi
                        </button>
                        <button
                          className="reply-cancel-btn"
                          onClick={() => {
                            setShowReply({ ...showReply, [comment.id]: false });
                            setReplyText({ ...replyText, [comment.id]: '' });
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-list">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="reply-item">
                          <div className="reply-avatar">
                            <img 
                              src={reply.avatar ? getImageUrl(reply.avatar) : '/default-avatar.png'} 
                              alt={reply.username}
                              onError={(e) => { e.target.src = '/default-avatar.png'; }}
                            />
                          </div>
                          <div className="reply-content">
                            <div className="reply-header">
                              <span className="reply-author">{reply.username}</span>
                              <span className="reply-date">{formatDate(reply.created_at)}</span>
                            </div>
                            <div className="reply-text">{reply.content}</div>
                            <button
                              className={`like-btn ${likedComments.has(reply.id) ? 'liked' : ''}`}
                              onClick={() => handleLike(reply.id)}
                            >
                              👍 {reply.likes_count || 0}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="comments-pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Trước
              </button>
              <span className="page-info">Trang {page} / {totalPages}</span>
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentsSection;

