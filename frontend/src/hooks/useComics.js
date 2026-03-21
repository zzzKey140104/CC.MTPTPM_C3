import { useState, useEffect } from 'react';
import { getLatestComics, getPopularComics, getComics } from '../services/api';

export const useLatestComics = (limit = 12) => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true);
        const response = await getLatestComics(limit);
        if (response.data.success) {
          setComics(response.data.data);
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error('Error fetching latest comics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComics();
  }, [limit]);

  return { comics, loading, error };
};

export const usePopularComics = (limit = 12) => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComics = async () => {
      try {
        setLoading(true);
        const response = await getPopularComics(limit);
        if (response.data.success) {
          setComics(response.data.data);
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error('Error fetching popular comics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComics();
  }, [limit]);

  return { comics, loading, error };
};

export const useComicsSearch = (searchQuery, page = 1, limit = 20) => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!searchQuery) {
      setComics([]);
      return;
    }

    const fetchComics = async () => {
      try {
        setLoading(true);
        const response = await getComics({ search: searchQuery, page, limit });
        if (response.data.success) {
          // Xử lý data có thể là array hoặc object có property data
          const comicsData = Array.isArray(response.data.data) 
            ? response.data.data 
            : (response.data.data?.data || []);
          setComics(comicsData);
          
          // Xử lý pagination
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          } else {
            setPagination({
              page: 1,
              totalPages: 1,
              total: comicsData.length
            });
          }
        } else {
          setComics([]);
          setPagination(null);
        }
      } catch (err) {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        console.error('Error searching comics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComics();
  }, [searchQuery, page, limit]);

  return { comics, loading, error, pagination };
};

