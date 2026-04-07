import { useState, useEffect } from 'react';
import { getComicById } from '../services/api';

export const useComic = (id) => {
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchComic = async () => {
      try {
        setLoading(true);
        const response = await getComicById(id);
        if (response.data.success) {
          setComic(response.data.data);
        } else {
          setError('Không tìm thấy truyện');
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error('Error fetching comic:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComic();
  }, [id]);

  return { comic, loading, error };
};

