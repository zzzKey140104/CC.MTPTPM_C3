import React, { useState, useRef, useEffect } from 'react';
import { aiChat, getAIChatHistory, clearAIChatHistory } from '../../services/api';
import './AIChatButton.css';

const AIChatButton = ({ comicId, chapterId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;

    const loadChatHistory = async () => {
      try {
        setLoadingHistory(true);
        const response = await getAIChatHistory({
          comicId: comicId || null,
          chapterId: chapterId || null,
          limit: 100
        });
        if (response.data?.success && Array.isArray(response.data?.data)) {
          const historyMessages = response.data.data.map((item) => ({
            role: item.role,
            content: item.content
          }));
          setMessages(historyMessages);
        }
      } catch (error) {
        console.error('Error loading AI chat history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [isOpen, comicId, chapterId]);

  // Đóng chat khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target)) {
        // Kiểm tra nếu click không phải vào nút toggle
        if (!event.target.closest('.ai-chat-toggle')) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Thêm message của user vào conversation
    const newUserMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      // Tạo conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await aiChat({
        message: userMessage,
        comicId: comicId || null,
        chapterId: chapterId || null,
        conversationHistory: conversationHistory
      });

      if (response.data.success) {
        const aiMessage = { role: 'assistant', content: response.data.data.response };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.message || 'Lỗi khi gửi tin nhắn');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    try {
      await clearAIChatHistory({
        comicId: comicId || null,
        chapterId: chapterId || null
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing AI chat history:', error);
      alert('Không thể xóa lịch sử chat. Vui lòng thử lại.');
    }
  };

  return (
    <div className="ai-chat-container" ref={chatContainerRef}>
      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-icon">🤖</span>
              <span>Chat AI về truyện</span>
            </div>
            <div className="ai-chat-actions">
              <button 
                className="ai-chat-clear-btn" 
                onClick={handleClearChat}
                title="Xóa lịch sử chat"
              >
                🗑️
              </button>
              <button 
                className="ai-chat-close-btn" 
                onClick={() => setIsOpen(false)}
                title="Đóng"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="ai-chat-messages">
            {loadingHistory ? (
              <div className="notification-loading">Đang tải lịch sử chat...</div>
            ) : messages.length === 0 ? (
              <div className="ai-chat-welcome">
                <div className="welcome-icon">👋</div>
                <h3>Xin chào! Tôi là trợ lý AI về truyện tranh</h3>
                <p>Bạn có thể hỏi tôi về:</p>
                <ul>
                  <li>Thông tin về truyện tranh</li>
                  <li>Nội dung và cốt truyện</li>
                  <li>Nhân vật và tác giả</li>
                  <li>Đề xuất truyện tương tự</li>
                  <li>Và nhiều hơn nữa!</li>
                </ul>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`ai-chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
                >
                  <div className="message-content">
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="ai-chat-message ai-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="ai-chat-input-container">
            <textarea
              className="ai-chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              rows="2"
              disabled={loading}
            />
            <button 
              className="ai-chat-send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
            >
              {loading ? '⏳' : '📤'}
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        className={`ai-chat-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat với AI"
      >
        {isOpen ? '✕' : '🤖'}
      </button>
    </div>
  );
};

export default AIChatButton;

