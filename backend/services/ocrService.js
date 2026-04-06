const Tesseract = require('tesseract.js');
const axios = require('axios');
const sharp = require('sharp');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class OcrService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🔍 Initializing OCR worker...');
      this.worker = await Tesseract.createWorker('vie+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`📖 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      await this.worker.setParameters({
        tessedit_pageseg_mode: '11', // sparse text mode (better for speech bubbles)
        preserve_interword_spaces: '1',
        user_defined_dpi: '300'
      });
      this.isInitialized = true;
      console.log('✅ OCR worker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OCR worker:', error);
      throw error;
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🔒 OCR worker terminated');
    }
  }

  async downloadImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`❌ Failed to download image from ${imageUrl}:`, error.message);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  async extractTextFromImage(imageBuffer) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const preprocessedBuffer = await this.preprocessImage(imageBuffer);
      const result = await this.worker.recognize(preprocessedBuffer);
      const words = Array.isArray(result?.data?.words) ? result.data.words : [];
      if (words.length > 0) {
        const filteredWords = words
          .filter((word) => {
            const confidence = Number(word?.confidence ?? word?.conf ?? 0);
            const text = `${word?.text || ''}`.trim();
            if (!text) return false;
            if (confidence < 55) return false;
            return /[A-Za-zÀ-ỹĐđ]/.test(text);
          })
          .map((word) => `${word.text}`.trim());

        if (filteredWords.length > 0) {
          return filteredWords.join(' ');
        }
      }
      return result.data.text;
    } catch (error) {
      console.error('❌ OCR recognition failed:', error.message);
      throw new Error(`OCR recognition failed: ${error.message}`);
    }
  }

  async extractTextFromImageUrl(imageUrl) {
    console.log(`📥 Downloading image from: ${imageUrl}`);
    const imageBuffer = await this.downloadImage(imageUrl);
    return await this.extractTextFromImage(imageBuffer);
  }

  async extractTextFromMultipleImages(imageUrls, onProgress = null) {
    const results = [];
    const totalImages = imageUrls.length;

    for (let i = 0; i < totalImages; i++) {
      const imageUrl = imageUrls[i];
      console.log(`\n📄 Processing image ${i + 1}/${totalImages}: ${imageUrl}`);

      try {
        const rawText = await this.extractTextFromImageUrl(imageUrl);
        const text = this.cleanPageText(rawText);
        results.push({
          pageNumber: i + 1,
          text: text,
          success: true,
          error: null
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: totalImages,
            text: text,
            pageNumber: i + 1
          });
        }
      } catch (error) {
        console.error(`❌ Failed to process image ${i + 1}:`, error.message);
        results.push({
          pageNumber: i + 1,
          text: '',
          success: false,
          error: error.message
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: totalImages,
            error: error.message,
            pageNumber: i + 1
          });
        }
      }
    }

    return results;
  }

  combineTexts(ocrResults) {
    const pages = ocrResults
      .filter(r => r.success && r.text)
      .map(r => r.text.trim());
    return this.stitchPages(pages);
  }

  async preprocessImage(imageBuffer) {
    // Preprocess to improve OCR quality and reduce runtime for huge images.
    return await sharp(imageBuffer)
      .rotate()
      .resize({
        width: 1600,
        withoutEnlargement: true,
        fit: 'inside'
      })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
  }

  cleanPageText(text) {
    if (!text) return '';
    const lines = text
      .split('\n')
      .map((line) => line.normalize('NFKC').trim())
      .filter(Boolean)
      .map((line) => line.replace(/\s+/g, ' '));

    const filtered = [];
    for (const line of lines) {
      if (line.length < 2) continue;
      if (/(.)\1{4,}/.test(line)) continue;

      const validChars = (line.match(/[0-9A-Za-zÀ-ỹĐđ.,!?;:'"“”‘’()\- ]/g) || []).length;
      const letterChars = (line.match(/[A-Za-zÀ-ỹĐđ]/g) || []).length;
      const ratio = validChars / line.length;
      if (ratio < 0.65 || letterChars < 2) continue;

      // Avoid near-duplicate consecutive lines.
      const prev = filtered[filtered.length - 1];
      if (prev && prev.toLowerCase() === line.toLowerCase()) continue;

      filtered.push(line);
    }

    // Keep enough context to stitch sentence fragments between adjacent pages.
    return filtered.join('\n').slice(0, 900);
  }

  cleanText(text) {
    if (!text) return '';

    const cleaned = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 2)
      .join('\n')
      .replace(/\f/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')
      .trim();

    if (cleaned.length <= 12000) return cleaned;

    const sliced = cleaned.slice(0, 12000);
    const lastSentenceBreak = Math.max(
      sliced.lastIndexOf('.'),
      sliced.lastIndexOf('!'),
      sliced.lastIndexOf('?'),
      sliced.lastIndexOf('\n')
    );
    if (lastSentenceBreak > 7000) {
      return sliced.slice(0, lastSentenceBreak + 1).trim();
    }
    return sliced.trim();
  }

  stitchPages(pageTexts = []) {
    const normalizedPages = pageTexts
      .map((page) => String(page || '').trim())
      .filter(Boolean);

    const stitched = [];
    for (const pageText of normalizedPages) {
      if (!stitched.length) {
        stitched.push(pageText);
        continue;
      }

      let prev = stitched[stitched.length - 1];
      let current = pageText;

      // Remove duplicated overlap between end of previous page and start of current page.
      const prevWords = prev.split(/\s+/).filter(Boolean);
      const currWords = current.split(/\s+/).filter(Boolean);
      const maxOverlap = Math.min(10, prevWords.length, currWords.length);
      let overlap = 0;
      for (let n = maxOverlap; n >= 3; n--) {
        const prevTail = prevWords.slice(-n).join(' ').toLowerCase();
        const currHead = currWords.slice(0, n).join(' ').toLowerCase();
        if (prevTail === currHead) {
          overlap = n;
          break;
        }
      }
      if (overlap > 0) {
        current = currWords.slice(overlap).join(' ');
      }

      const prevEndsSentence = /[.!?…:]"?$/.test(prev.trim());
      const currentStartsLower = /^[a-zà-ỹđ]/i.test(current.trim()) && /^[a-zà-ỹđ]/.test(current.trim());
      const prevEndsHyphen = /[-–—]$/.test(prev.trim());

      if (prevEndsHyphen) {
        prev = prev.replace(/[-–—]\s*$/, '');
        stitched[stitched.length - 1] = `${prev}${current}`.trim();
        continue;
      }

      if (!prevEndsSentence || currentStartsLower) {
        stitched[stitched.length - 1] = `${prev} ${current}`.replace(/\s+/g, ' ').trim();
      } else {
        stitched.push(current);
      }
    }

    return stitched.join('\n\n').trim();
  }

  async refineTextWithAI(text) {
    if (!this.gemini || !text || text.length < 200) return text;
    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `
Bạn là bộ lọc OCR cho truyện tranh tiếng Việt.
Nhiệm vụ:
1) Giữ đúng thứ tự nội dung.
2) Ghép các đoạn bị cắt giữa ảnh/liên trang thành câu hoàn chỉnh.
3) Loại bỏ chữ nhiễu, ký tự rác, watermark/menu/icon, chuỗi không có nghĩa.
4) Chỉ trả về văn bản sạch, không giải thích.

Văn bản OCR:
${text.slice(0, 15000)}
      `.trim();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const refined = response.text().trim();
      return refined || text;
    } catch (error) {
      console.warn('⚠️ AI OCR refine skipped:', error.message);
      return text;
    }
  }
}

module.exports = new OcrService();
