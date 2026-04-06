const edgeTTS = require('edge-tts');
const fs = require('fs').promises;
const path = require('path');

class TtsService {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'uploads', 'audios');
    this.voice = 'vi-VN-HonMyBellNeural';
    this.rate = '+10%';
    this.volume = '+0%';
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async textToSpeech(text, options = {}) {
    const {
      voice = this.voice,
      rate = this.rate,
      volume = this.volume,
      outputFilename = null
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is empty');
    }

    await this.ensureOutputDir();

    const filename = outputFilename || `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const outputPath = path.join(this.outputDir, filename);
    const relativeUrl = `/uploads/audios/${filename}`;

    try {
      console.log('🎤 Starting text-to-speech conversion...');
      console.log(`📝 Text length: ${text.length} characters`);
      console.log(`🎙️ Voice: ${voice}`);

      const startTime = Date.now();

      await edgeTTS.ttsSave(text, outputPath, {
        voice: voice,
        rate: rate,
        volume: volume
      });

      const processingTime = Date.now() - startTime;
      const stats = await fs.stat(outputPath);

      console.log(`✅ Audio file created: ${filename}`);
      console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`⏱️ Processing time: ${processingTime}ms`);

      return {
        success: true,
        filename: filename,
        path: outputPath,
        url: relativeUrl,
        size: stats.size,
        textLength: text.length,
        voice: voice,
        rate: rate,
        volume: volume
      };
    } catch (error) {
      console.error('❌ TTS conversion failed:', error);
      throw new Error(`TTS conversion failed: ${error.message}`);
    }
  }

  async textToSpeechVietnamese(text, options = {}) {
    const vietnameseOptions = {
      voice: 'vi-VN-HonMyBellNeural',
      rate: '+10%',
      volume: '+0%',
      ...options
    };
    return await this.textToSpeech(text, vietnameseOptions);
  }

  async textToSpeechStream(text, options = {}) {
    const {
      voice = this.voice,
      rate = this.rate,
      volume = this.volume
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is empty');
    }

    try {
      console.log('🎤 Starting text-to-speech stream...');
      const audioBuffer = await edgeTTS.tts(text, {
        voice: voice,
        rate: rate,
        volume: volume
      });
      return audioBuffer;
    } catch (error) {
      console.error('❌ TTS stream failed:', error);
      throw new Error(`TTS stream failed: ${error.message}`);
    }
  }

  async deleteAudioFile(filename) {
    try {
      const filePath = path.join(this.outputDir, filename);
      await fs.unlink(filePath);
      console.log(`🗑️ Audio file deleted: ${filename}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`⚠️ Audio file not found: ${filename}`);
        return false;
      }
      throw error;
    }
  }

  async getAvailableVoices() {
    try {
      const voices = await edgeTTS.getVoices();
      return voices.map(v => ({
        name: v.ShortName,
        fullName: v.Name,
        friendlyName: v.FriendlyName,
        gender: v.Gender,
        locale: v.Locale,
        categories: v.VoiceTag?.ContentCategories || [],
        personalities: v.VoiceTag?.VoicePersonalities || []
      }));
    } catch (error) {
      console.error('❌ Failed to get voices:', error);
      return this.getDefaultVoices();
    }
  }

  getDefaultVoices() {
    return [
      { name: 'vi-VN-HonMyBellNeural', locale: 'vi-VN', gender: 'Female', description: 'Hồng My Bell - Nữ (Mặc định)' },
      { name: 'vi-VN-NamMinhNeural', locale: 'vi-VN', gender: 'Male', description: 'Nam Minh - Nam' },
      { name: 'vi-VN-PhuongThaoNeural', locale: 'vi-VN', gender: 'Female', description: 'Phương Thảo - Nữ' },
      { name: 'en-US-JennyNeural', locale: 'en-US', gender: 'Female', description: 'Jenny - Nữ (Tiếng Anh)' },
      { name: 'en-US-ChristopherNeural', locale: 'en-US', gender: 'Male', description: 'Christopher - Nam (Tiếng Anh)' }
    ];
  }

  estimateDuration(text, rate = this.rate) {
    const wordsPerMinute = 150;
    const rateMultiplier = this.getRateMultiplier(rate);
    const adjustedWpm = wordsPerMinute * rateMultiplier;
    
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const seconds = Math.ceil((words / adjustedWpm) * 60);
    
    return seconds;
  }

  getRateMultiplier(rate) {
    const match = rate.match(/([+-]?)(\d+)%/);
    if (!match) return 1;
    
    const sign = match[1] === '-' ? -1 : 1;
    const percent = parseInt(match[2]) * sign;
    
    return 1 + (percent / 100);
  }
}

module.exports = new TtsService();
