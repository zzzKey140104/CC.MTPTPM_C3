import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <div className="footer-logo">
              <img
                src="/logo.jpg"
                alt="ReaCom logo"
                className="footer-logo-image"
              />
              <h2 className="logo-text">ReaCom</h2>
            </div>
            <p className="footer-description">
              Nền tảng đọc truyện tranh online miễn phí, cập nhật nhanh chóng với hàng ngàn bộ truyện đa dạng thể loại.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Liên kết nhanh</h3>
            <ul className="footer-links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/advanced-search">Tìm kiếm nâng cao</Link></li>
              <li><Link to="/comics">Tất cả truyện</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-section">
            <h3 className="footer-title">Xếp hạng</h3>
            <ul className="footer-links">
              <li><Link to="/ranking?type=day">Top ngày</Link></li>
              <li><Link to="/ranking?type=favorite">Yêu thích</Link></li>
              <li><Link to="/ranking?type=full">Truyện hoàn thành</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Liên hệ</h3>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <a href="mailto:khanhhungbadong@gmail.com">khanhhungbadong@gmail.com</a>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <a href="tel:0868686868">0868686868</a>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Khu Công nghệ cao XLHN, Hiệp Phú, Thủ Đức, TP.HCM</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

