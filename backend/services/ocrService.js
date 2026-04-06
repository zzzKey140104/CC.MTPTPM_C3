const Tesseract = require('tesseract.js');
const axios = require('axios');

class OcrService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
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
      const result = await this.worker.recognize(imageBuffer);
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
        const text = await this.extractTextFromImageUrl(imageUrl);
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
    return ocrResults
      .filter(r => r.success && r.text)
      .map(r => r.text.trim())
      .join('\n\n');
  }

  cleanText(text) {
    if (!text) return '';

    return text
      .replace(/\f/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')
      .trim();
  }
}

module.exports = new OcrService();
