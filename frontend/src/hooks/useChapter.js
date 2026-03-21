import { useState, useEffect } from 'react';
import { getChapterById, incrementChapterViews } from '../services/api';

// Set global để track các chương đã tăng lượt xem trong session này
const viewedChapters = new Set();

export const useChapter = (id) => {
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchChapter = async () => {
      try {
        setLoading(true);
        const response = await getChapterById(id);
        if (response.data.success) {
          const chapterData = response.data.data;
          // Parse images if needed
          if (chapterData.images) {
            if (typeof chapterData.images === 'string') {
              try {
                chapterData.images = JSON.parse(chapterData.images);
              } catch (e) {
                console.error('Error parsing images in hook:', e);
                chapterData.images = [];
              }
            }
            // Đảm bảo là array và filter empty
            if (Array.isArray(chapterData.images)) {
              chapterData.images = chapterData.images.filter(img => img && typeof img === 'string' && img.trim());
            } else {
              chapterData.images = [];
            }
          } else {
            chapterData.images = [];
          }
          console.log('Chapter data loaded:', chapterData);
          setChapter(chapterData);

          // Tăng lượt xem chỉ 1 lần cho mỗi chương trong session này
          // Sử dụng Set để tránh race condition khi React StrictMode chạy 2 lần
          const viewKey = `chapter_${id}_viewed`;
          if (!viewedChapters.has(viewKey)) {
            // Đặt flag ngay lập tức để các lần gọi sau sẽ skip
            viewedChapters.add(viewKey);
            // Gọi API tăng lượt xem (không await để không block UI)
            incrementChapterViews(id).catch(err => {
              // Nếu lỗi, remove khỏi Set để có thể thử lại
              viewedChapters.delete(viewKey);
              console.error('Error incrementing chapter views:', err);
            });
          }
        } else {
          setError('Không tìm thấy chương');
        }
      } catch (err) {
        // Kiểm tra nếu lỗi là do chương bị đóng
        const errorMessage = err.response?.data?.message || err.message;
        if (errorMessage && errorMessage.includes('đóng')) {
          setError(errorMessage);
        } else {
          setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        }
        console.error('Error fetching chapter:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [id]);

  return { chapter, loading, error };
};

