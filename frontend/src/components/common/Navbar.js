import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCategories } from '../../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const categoriesRef = useRef(null);
  const rankingRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setShowCategories(false);
      }
      if (rankingRef.current && !rankingRef.current.contains(event.target)) {
        setShowRanking(false);
      }
    };

    if (showCategories || showRanking) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategories, showRanking]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Trang chủ
          </Link>

          <div
            className="nav-link dropdown"
            ref={rankingRef}
          >
            <span 
              onClick={() => {
                setShowRanking(!showRanking);
                setShowCategories(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              Xếp hạng ▼
            </span>
            {showRanking && (
              <div className="dropdown-menu">
                <Link
                  to="/ranking?type=day"
                  className="dropdown-item"
                  onClick={() => setShowRanking(false)}
                >
                  Top ngày
                </Link>
                <Link
                  to="/ranking?type=week"
                  className="dropdown-item"
                  onClick={() => setShowRanking(false)}
                >
                  Top tuần
                </Link>
                <Link
                  to="/ranking?type=month"
                  className="dropdown-item"
                  onClick={() => setShowRanking(false)}
                >
                  Top tháng
                </Link>
                <Link
                  to="/ranking?type=favorite"
                  className="dropdown-item"
                  onClick={() => setShowRanking(false)}
                >
                  Yêu thích
                </Link>
                <Link
                  to="/ranking?type=latest_update"
                  className="dropdown-item"
                  onClick={() => setShowRanking(false)}
                >
                  Mới cập nhật
                </Link>
                <Link
                  to="/ranking?type=new_comic"
                  className="dropdown-item"
                  onClick={() => setShowRanking(false)}
                >
                  Truyện mới
                </Link>
                <Link
                  to="/ranking?type=full"
                  className="dropdown-item"
                  onClick={() => setShowRanking(false)}
                >
                  Truyện full
                </Link>
              </div>
            )}
          </div>
          
          <div 
            className="nav-link dropdown"
            ref={categoriesRef}
          >
            <span 
              onClick={() => {
                setShowCategories(!showCategories);
                setShowRanking(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              Thể loại ▼
            </span>
            {showCategories && (
              <div className="dropdown-menu">
                {categories.map(category => (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    className="dropdown-item"
                    onClick={() => setShowCategories(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/advanced-search"
            className={`nav-link ${location.pathname === '/advanced-search' ? 'active' : ''}`}
          >
            Tìm truyện
          </Link>

          {isAuthenticated && (
            <>
              <Link 
                to="/history" 
                className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
              >
                Lịch sử
              </Link>
              <Link 
                to="/favorites" 
                className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}
              >
                Theo dõi
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

