import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { IMAGE_PLACEHOLDER } from '../../constants';
import { getImageUrl } from '../../utils/helpers';
import './ComicCard.css';

const ComicCard = React.memo(({ comic }) => {
  const { user } = useAuth();
  const userIsVip = user && (user.role === 'vip' || user.role === 'admin');
  const isVipComic = comic.access_status === 'vip';

  const handleClick = (e) => {
    if (isVipComic && !userIsVip) {
      e.preventDefault();
      alert('Truyện này chỉ dành cho thành viên VIP. Vui lòng nâng cấp tài khoản để đọc.');
      return false;
    }
  };

  return (
    <Link 
      to={`/comic/${comic.id}`} 
      className={`comic-card ${isVipComic && !userIsVip ? 'comic-vip-locked' : ''}`}
      onClick={handleClick}
    >
      <div className="comic-cover">
        <img 
          src={getImageUrl(comic.cover_image) || IMAGE_PLACEHOLDER} 
          alt={comic.title}
          loading="lazy"
          onError={(e) => {
            e.target.src = IMAGE_PLACEHOLDER;
          }}
        />
        <div className="comic-overlay">
          {comic.access_status === 'vip' && (
            <span className="comic-vip-badge">VIP</span>
          )}
          <span
            className={`comic-status ${
              comic.status === 'completed'
                ? 'comic-status-completed'
                : comic.status === 'ongoing'
                ? 'comic-status-ongoing'
                : 'comic-status-paused'
            }`}
          >
            {comic.status === 'ongoing'
              ? 'Đang ra'
              : comic.status === 'completed'
              ? 'Hoàn thành'
              : 'Tạm ngưng'}
          </span>
        </div>
      </div>
      <div className="comic-info">
        <h3 className="comic-title">{comic.title}</h3>
        <p className="comic-author">{comic.author || 'Chưa rõ tác giả'}</p>
        <div className="comic-stats">
          <span>👁 {comic.views || 0}</span>
          <span>📖 {comic.total_chapters || 0} chương</span>
        </div>
      </div>
    </Link>
  );
});

ComicCard.displayName = 'ComicCard';

export default ComicCard;

