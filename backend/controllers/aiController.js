const { GoogleGenerativeAI } = require('@google/generative-ai');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const { successResponse, errorResponse } = require('../utils/response');
const axios = require('axios');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

class AIController {
  /**
   * Tóm tắt truyện dựa vào tên, tác giả và đất nước
   */
  async summarizeComic(req, res) {
    try {
      const { comicId } = req.params;
      
      if (!process.env.GEMINI_API_KEY) {
        return errorResponse(res, 'API key Gemini chưa được cấu hình', 500);
      }

      // Lấy thông tin truyện
      const comic = await Comic.findById(comicId, false, req.user?.role === 'admin');
      if (!comic) {
        return errorResponse(res, 'Không tìm thấy truyện', 404);
      }

      // Lấy thông tin đất nước
      const countryName = comic.country_name || 'Chưa rõ';

      // Tạo prompt
      const prompt = `Bạn là một chuyên gia phân tích truyện tranh. Hãy tóm tắt truyện tranh sau đây một cách ngắn gọn và hấp dẫn:

Thông tin truyện:
- Tên truyện: ${comic.title}
- Tác giả: ${comic.author || 'Chưa rõ'}
- Đất nước: ${countryName}
${comic.description ? `- Mô tả hiện tại: ${comic.description}` : ''}

Hãy tạo một bản tóm tắt ngắn gọn về truyện này (khoảng 150-200 từ), bao gồm:
1. Giới thiệu tổng quan về truyện
2. Điểm nổi bật của truyện
3. Đối tượng độc giả phù hợp

Hãy viết bằng tiếng Việt, giọng văn tự nhiên và hấp dẫn. QUAN TRỌNG: Tóm tắt phải ngắn gọn, chỉ khoảng 150-200 từ.`;

      const model = getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      return successResponse(res, { summary }, 'Tóm tắt truyện thành công');
    } catch (error) {
      console.error('Error summarizing comic:', error);
      return errorResponse(res, 'Lỗi khi tạo tóm tắt truyện: ' + error.message, 500);
    }
  }

  /**
   * Tóm tắt chương dựa vào tên truyện, tác giả, đất nước và hình ảnh
   */
  async summarizeChapter(req, res) {
    try {
      const { chapterId } = req.params;
      
      if (!process.env.GEMINI_API_KEY) {
        return errorResponse(res, 'API key Gemini chưa được cấu hình', 500);
      }

      // Lấy thông tin chương
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return errorResponse(res, 'Không tìm thấy chương', 404);
      }

      // Lấy thông tin truyện
      const comic = await Comic.findById(chapter.comic_id, false, req.user?.role === 'admin');
      if (!comic) {
        return errorResponse(res, 'Không tìm thấy truyện', 404);
      }

      const countryName = comic.country_name || 'Chưa rõ';

      // Parse images
      let images = [];
      if (chapter.images) {
        if (typeof chapter.images === 'string') {
          try {
            images = JSON.parse(chapter.images);
          } catch (e) {
            images = [];
          }
        } else if (Array.isArray(chapter.images)) {
          images = chapter.images;
        }
      }

      const model = getModel();

      // Tạo prompt text
      const textPrompt = `Bạn là một chuyên gia phân tích truyện tranh. Hãy phân tích và tóm tắt ngắn gọn chương truyện sau:

Thông tin truyện:
- Tên truyện: ${comic.title}
- Tác giả: ${comic.author || 'Chưa rõ'}
- Đất nước: ${countryName}
- Chương số: ${chapter.chapter_number}
${chapter.title ? `- Tiêu đề chương: ${chapter.title}` : ''}


Hãy viết bằng tiếng Việt, ngắn gọn và súc tích dựa vào các tiêu chí sau ttóm tắt nội dung chương (dựa trên hình ảnh), Điểm nhấn quan trọng trong chương và Kết nối với cốt truyện tổng thể
 sau đó viết tóm tắt ngắn gọn thành đoạn văn chỉ khoảng 150-200 từ
QUAN TRỌNG: Tóm tắt phải ngắn gọn thành đoạn văn chỉ khoảng 150-200 từ

`;

      // Nếu có hình ảnh, sử dụng vision model
      if (images && images.length > 0) {
        try {
          // Lấy một số hình ảnh đầu tiên để phân tích (giới hạn để tránh quá tải)
          const imagesToAnalyze = images.slice(0, Math.min(10, images.length));
          
          // Helper function để tạo URL hình ảnh
          const getImageUrl = (imagePath) => {
            if (!imagePath || typeof imagePath !== 'string') {
              return null;
            }
            imagePath = imagePath.trim();
            if (!imagePath) return null;
            
            // Nếu đã là full URL, trả về nguyên
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
              return imagePath;
            }
            
            // Nếu là relative path, tạo URL từ backend
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
            return `${backendUrl}${cleanPath}`;
          };

          // Tải và chuyển đổi hình ảnh thành base64
          const imageParts = [];
          for (let i = 0; i < imagesToAnalyze.length; i++) {
            try {
              const imageUrl = getImageUrl(imagesToAnalyze[i]);
              if (!imageUrl) continue;
              
              // Tải hình ảnh từ URL
              const imageResponse = await axios.get(imageUrl, { 
                responseType: 'arraybuffer',
                timeout: 10000 // 10 seconds timeout
              });
              const imageBuffer = Buffer.from(imageResponse.data);
              const base64Image = imageBuffer.toString('base64');
              
              // Xác định MIME type
              const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
              
              imageParts.push({
                inlineData: {
                  data: base64Image,
                  mimeType: mimeType
                }
              });
            } catch (imgError) {
              console.error(`Error loading image ${i}:`, imgError.message);
              // Bỏ qua hình ảnh lỗi, tiếp tục với hình ảnh khác
            }
          }

          if (imageParts.length > 0) {
            const result = await model.generateContent([textPrompt, ...imageParts]);
            const response = await result.response;
            const summary = response.text();
            return successResponse(res, { summary }, 'Tóm tắt chương thành công');
          }
        } catch (visionError) {
          console.error('Error with vision model:', visionError);
          // Fallback to text-only if vision fails
        }
      }

      // Fallback: chỉ sử dụng text nếu không có hình ảnh hoặc lỗi vision
      const textModel = getModel();
      const result = await textModel.generateContent(textPrompt);
      const response = await result.response;
      const summary = response.text();

      return successResponse(res, { summary }, 'Tóm tắt chương thành công');
    } catch (error) {
      console.error('Error summarizing chapter:', error);
      return errorResponse(res, 'Lỗi khi tạo tóm tắt chương: ' + error.message, 500);
    }
  }

  /**
   * Chat với AI về truyện
   */
  async chat(req, res) {
    try {
      const { message, comicId, chapterId, conversationHistory = [] } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return errorResponse(res, 'API key Gemini chưa được cấu hình', 500);
      }

      if (!message || !message.trim()) {
        return errorResponse(res, 'Vui lòng nhập câu hỏi', 400);
      }

      // Lấy thông tin context nếu có
      let context = '';
      if (comicId) {
        const comic = await Comic.findById(comicId, false, req.user?.role === 'admin');
        if (comic) {
          context += `\nThông tin truyện hiện tại:\n- Tên: ${comic.title}\n- Tác giả: ${comic.author || 'Chưa rõ'}\n- Đất nước: ${comic.country_name || 'Chưa rõ'}\n`;
          if (comic.description) {
            context += `- Mô tả: ${comic.description}\n`;
          }
        }
      }

      if (chapterId) {
        const chapter = await Chapter.findById(chapterId);
        if (chapter) {
          context += `\nThông tin chương hiện tại:\n- Chương số: ${chapter.chapter_number}\n`;
          if (chapter.title) {
            context += `- Tiêu đề: ${chapter.title}\n`;
          }
        }
      }

      // Tạo system prompt
      const systemPrompt = `Bạn là một trợ lý AI chuyên về truyện tranh. Bạn có thể trả lời các câu hỏi về truyện tranh, tác giả, nội dung, nhân vật, và các chủ đề liên quan.${context}

Hãy trả lời một cách thân thiện, chi tiết và hữu ích bằng tiếng Việt.`;

      const model = getModel();
      
      // Xây dựng conversation history với system prompt
      const fullPrompt = systemPrompt + '\n\nCuộc trò chuyện:\n' + 
        conversationHistory.map(msg => `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`).join('\n') +
        `\nNgười dùng: ${message}\nAI:`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      return successResponse(res, { 
        response: aiResponse,
        message: message
      }, 'Chat thành công');
    } catch (error) {
      console.error('Error in AI chat:', error);
      return errorResponse(res, 'Lỗi khi chat với AI: ' + error.message, 500);
    }
  }
}

module.exports = new AIController();

