const { GoogleGenerativeAI } = require('@google/generative-ai');
const Comic = require('../models/Comic');
const Chapter = require('../models/Chapter');
const UsedAI = require('../models/UsedAI');
const AIUsageStatsDaily = require('../models/AIUsageStatsDaily');
const axios = require('axios');
const { createServiceError } = require('./serviceError');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function getModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

class AIService {
  estimateTokens(text = '') {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  getTodayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  async trackDailyUsage({
    userId,
    chatCount = 0,
    summaryCount = 0,
    inputText = '',
    outputText = ''
  }) {
    if (!userId) return;

    const inputTokens = this.estimateTokens(inputText);
    const outputTokens = this.estimateTokens(outputText);
    const estimatedCost = Number(((inputTokens + outputTokens) * 0.00000035).toFixed(6));

    await AIUsageStatsDaily.upsertDailyUsage({
      user_id: userId,
      date: this.getTodayDate(),
      chat_count: chatCount,
      summary_count: summaryCount,
      estimated_input_tokens: inputTokens,
      estimated_output_tokens: outputTokens,
      estimated_cost: estimatedCost
    });
  }

  normalizeContext({ comicId, chapterId }) {
    const normalizedComicId = comicId ? Number.parseInt(comicId, 10) : null;
    const normalizedChapterId = chapterId ? Number.parseInt(chapterId, 10) : null;

    return {
      comicId: Number.isNaN(normalizedComicId) ? null : normalizedComicId,
      chapterId: Number.isNaN(normalizedChapterId) ? null : normalizedChapterId
    };
  }

  ensureApiKey() {
    if (!process.env.GEMINI_API_KEY) {
      throw createServiceError('API key Gemini chưa được cấu hình', 500);
    }
  }

  async summarizeComic({ comicId, user }) {
    this.ensureApiKey();
    const comic = await Comic.findById(comicId, false, user?.role === 'admin');
    if (!comic) throw createServiceError('Không tìm thấy truyện', 404);

    const countryName = comic.country_name || 'Chưa rõ';
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
    const summaryText = response.text();
    if (user?.id) {
      await this.trackDailyUsage({
        userId: user.id,
        summaryCount: 1,
        inputText: prompt,
        outputText: summaryText
      });
    }
    return { summary: summaryText };
  }

  getImageUrl(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') return null;
    const normalized = imagePath.trim();
    if (!normalized) return null;
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${backendUrl}${cleanPath}`;
  }

  async summarizeChapter({ chapterId, user }) {
    this.ensureApiKey();
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) throw createServiceError('Không tìm thấy chương', 404);

    const comic = await Comic.findById(chapter.comic_id, false, user?.role === 'admin');
    if (!comic) throw createServiceError('Không tìm thấy truyện', 404);

    const countryName = comic.country_name || 'Chưa rõ';
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

    const textPrompt = `Bạn là một chuyên gia phân tích truyện tranh. Hãy phân tích và tóm tắt ngắn gọn chương truyện sau:

Thông tin truyện:
- Tên truyện: ${comic.title}
- Tác giả: ${comic.author || 'Chưa rõ'}
- Đất nước: ${countryName}
- Chương số: ${chapter.chapter_number}
${chapter.title ? `- Tiêu đề chương: ${chapter.title}` : ''}

Hãy viết bằng tiếng Việt, ngắn gọn và súc tích dựa vào các tiêu chí sau ttóm tắt nội dung chương (dựa trên hình ảnh), Điểm nhấn quan trọng trong chương và Kết nối với cốt truyện tổng thể
sau đó viết tóm tắt ngắn gọn thành đoạn văn chỉ khoảng 150-200 từ
QUAN TRỌNG: Tóm tắt phải ngắn gọn thành đoạn văn chỉ khoảng 150-200 từ`;

    const model = getModel();
    if (images && images.length > 0) {
      try {
        const imagesToAnalyze = images.slice(0, Math.min(10, images.length));
        const imageParts = [];
        for (let i = 0; i < imagesToAnalyze.length; i++) {
          try {
            const imageUrl = this.getImageUrl(imagesToAnalyze[i]);
            if (!imageUrl) continue;
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
              timeout: 10000
            });
            imageParts.push({
              inlineData: {
                data: Buffer.from(imageResponse.data).toString('base64'),
                mimeType: imageResponse.headers['content-type'] || 'image/jpeg'
              }
            });
          } catch (imgError) {
            console.error(`Error loading image ${i}:`, imgError.message);
          }
        }

        if (imageParts.length > 0) {
          const result = await model.generateContent([textPrompt, ...imageParts]);
          const response = await result.response;
          const summaryText = response.text();
          if (user?.id) {
            await this.trackDailyUsage({
              userId: user.id,
              summaryCount: 1,
              inputText: textPrompt,
              outputText: summaryText
            });
          }
          return { summary: summaryText };
        }
      } catch (visionError) {
        console.error('Error with vision model:', visionError);
      }
    }

    const result = await model.generateContent(textPrompt);
    const response = await result.response;
    const summaryText = response.text();
    if (user?.id) {
      await this.trackDailyUsage({
        userId: user.id,
        summaryCount: 1,
        inputText: textPrompt,
        outputText: summaryText
      });
    }
    return { summary: summaryText };
  }

  async chat({ message, comicId, chapterId, conversationHistory = [], user }) {
    this.ensureApiKey();
    if (!message || !message.trim()) throw createServiceError('Vui lòng nhập câu hỏi', 400);

    let context = '';
    if (comicId) {
      const comic = await Comic.findById(comicId, false, user?.role === 'admin');
      if (comic) {
        context += `\nThông tin truyện hiện tại:\n- Tên: ${comic.title}\n- Tác giả: ${comic.author || 'Chưa rõ'}\n- Đất nước: ${comic.country_name || 'Chưa rõ'}\n`;
        if (comic.description) context += `- Mô tả: ${comic.description}\n`;
      }
    }
    if (chapterId) {
      const chapter = await Chapter.findById(chapterId);
      if (chapter) {
        context += `\nThông tin chương hiện tại:\n- Chương số: ${chapter.chapter_number}\n`;
        if (chapter.title) context += `- Tiêu đề: ${chapter.title}\n`;
      }
    }

    const systemPrompt = `Bạn là một trợ lý AI chuyên về truyện tranh. Bạn có thể trả lời các câu hỏi về truyện tranh, tác giả, nội dung, nhân vật, và các chủ đề liên quan.${context}

Hãy trả lời một cách thân thiện, chi tiết và hữu ích bằng tiếng Việt.`;

    const fullPrompt =
      systemPrompt +
      '\n\nCuộc trò chuyện:\n' +
      conversationHistory.map((msg) => `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`).join('\n') +
      `\nNgười dùng: ${message}\nAI:`;

    const model = getModel();
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();

    if (user?.id) {
      const context = this.normalizeContext({ comicId, chapterId });
      await UsedAI.create({
        user_id: user.id,
        comic_id: context.comicId,
        chapter_id: context.chapterId,
        role: 'user',
        content: message.trim()
      });
      await UsedAI.create({
        user_id: user.id,
        comic_id: context.comicId,
        chapter_id: context.chapterId,
        role: 'assistant',
        content: responseText
      });
      await this.trackDailyUsage({
        userId: user.id,
        chatCount: 1,
        inputText: `${fullPrompt}\n${message}`,
        outputText: responseText
      });
    }

    return { response: responseText, message };
  }

  async getChatHistory({ user, comicId, chapterId, limit = 50 }) {
    if (!user?.id) {
      throw createServiceError('Vui lòng đăng nhập để xem lịch sử chat', 401);
    }
    const context = this.normalizeContext({ comicId, chapterId });
    const history = await UsedAI.findByContext(user.id, {
      comicId: context.comicId,
      chapterId: context.chapterId,
      limit
    });
    return history;
  }

  async clearChatHistory({ user, comicId, chapterId }) {
    if (!user?.id) {
      throw createServiceError('Vui lòng đăng nhập để xóa lịch sử chat', 401);
    }
    const context = this.normalizeContext({ comicId, chapterId });
    const deletedCount = await UsedAI.clearByContext(user.id, {
      comicId: context.comicId,
      chapterId: context.chapterId
    });
    return { deletedCount };
  }

  async getDailyUsage({ user, from, to }) {
    if (!user?.id) {
      throw createServiceError('Vui lòng đăng nhập để xem thống kê AI', 401);
    }
    const today = this.getTodayDate();
    const fromDate = from || '1970-01-01';
    const toDate = to || today;
    return AIUsageStatsDaily.findByDateRange(user.id, fromDate, toDate);
  }

  async getUsageSummary({ user }) {
    if (!user?.id) {
      throw createServiceError('Vui lòng đăng nhập để xem thống kê AI', 401);
    }
    return AIUsageStatsDaily.getSummary(user.id);
  }
}

module.exports = new AIService();
