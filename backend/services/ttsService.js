const fs = require('fs').promises;
const path = require('path');
const say = require('say');
const gTTS = require('gtts');

class TtsService {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'uploads', 'audios');
    this.voice = 'vi-VN-HonMyBellNeural';
    this.rate = '+10%';
    this.volume = '+0%';
    this.edgeTTS = null;
    this.preferLocal = true;
    this.localVoice = null;
    this.localVoices = null;
  }

  async getEdgeTTS() {
    if (!this.edgeTTS) {
      // edge-tts is ESM-only in newer versions, so load it lazily via dynamic import.
      this.edgeTTS = await import('edge-tts/out/index.js');
    }
    return this.edgeTTS;
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
      outputFilename = null,
      preferLocal = this.preferLocal
    } = options;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is empty');
    }

    await this.ensureOutputDir();

    const buildFallbackFilename = () =>
      (outputFilename || `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`).replace(/\.mp3$/i, '.wav');

    const runLocalTts = async () => {
      const fallbackFilename = buildFallbackFilename();
      const fallbackOutputPath = path.join(this.outputDir, fallbackFilename);
      const fallbackUrl = `/uploads/audios/${fallbackFilename}`;
      const fallbackSpeed = this.getSaySpeedFromRate(rate);

      const localVoice = await this.getPreferredLocalVoice(voice);
      await new Promise((resolve, reject) => {
        say.export(text, localVoice, fallbackSpeed, fallbackOutputPath, (fallbackError) => {
          if (fallbackError) return reject(fallbackError);
          resolve();
        });
      });

      const fallbackStats = await fs.stat(fallbackOutputPath);
      console.log(`✅ Local TTS audio file created: ${fallbackFilename}`);

      return {
        success: true,
        provider: 'windows-sapi',
        filename: fallbackFilename,
        path: fallbackOutputPath,
        url: fallbackUrl,
        size: fallbackStats.size,
        textLength: text.length,
        voice: localVoice || 'default',
        rate: rate,
        volume: volume
      };
    };

    const runGoogleTranslateTts = async () => {
      const filename = (outputFilename || `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`)
        .replace(/\.wav$/i, '.mp3');
      const outputPath = path.join(this.outputDir, filename);
      const relativeUrl = `/uploads/audios/${filename}`;
      const normalized = this.normalizeTextForSpeech(text);

      await new Promise((resolve, reject) => {
        const tts = new gTTS(normalized, 'vi');
        tts.save(outputPath, (error) => {
          if (error) return reject(error);
          resolve();
        });
      });

      const stats = await fs.stat(outputPath);
      console.log(`✅ Google Translate TTS audio file created: ${filename}`);
      return {
        success: true,
        provider: 'google-translate-tts',
        filename,
        path: outputPath,
        url: relativeUrl,
        size: stats.size,
        textLength: text.length,
        voice: 'vi-google',
        rate,
        volume
      };
    };

    const runEdgeTts = async () => {
      const edgeTTS = await this.getEdgeTTS();
      const filename = outputFilename || `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
      const outputPath = path.join(this.outputDir, filename);
      const relativeUrl = `/uploads/audios/${filename}`;
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
        provider: 'edge-tts',
        filename: filename,
        path: outputPath,
        url: relativeUrl,
        size: stats.size,
        textLength: text.length,
        voice: voice,
        rate: rate,
        volume: volume
      };
    };

    if (preferLocal) {
      try {
        console.log('🔊 Local-first TTS mode enabled');
        const localVoice = await this.getPreferredLocalVoice(voice);
        const hasVietnameseLocalVoice = localVoice && /vietnam|vi-vn|microsoft an/i.test(localVoice);
        if (hasVietnameseLocalVoice) {
          return await runLocalTts();
        }

        // No local Vietnamese voice found -> prefer Vietnamese online fallback before English local voice.
        console.warn('⚠️ No local Vietnamese voice found, switching to Google Translate TTS (vi)...');
        return await runGoogleTranslateTts();
      } catch (localError) {
        console.warn('⚠️ Preferred local/Google TTS failed, fallback to edge-tts:', localError.message);
      }
    }

    try {
      return await runEdgeTts();
    } catch (edgeError) {
      console.error('❌ edge-tts conversion failed:', edgeError);
      if (!preferLocal) {
        console.warn('⚠️ edge-tts failed, fallback to local TTS...');
        try {
          return await runLocalTts();
        } catch (localError) {
          throw new Error(`TTS conversion failed: ${localError.message}`);
        }
      }
      throw new Error(`TTS conversion failed: ${edgeError.message}`);
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
      const edgeTTS = await this.getEdgeTTS();
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
    const localVoices = await this.getInstalledLocalVoices();
    if (localVoices.length > 0) {
      const localMapped = localVoices.map((voiceName) => ({
        name: voiceName,
        fullName: voiceName,
        friendlyName: `${voiceName} (Local SAPI)`,
        gender: /zira|an|female|girl/i.test(voiceName) ? 'Female' : 'Unknown',
        locale: /vietnam|vi-vn|an/i.test(voiceName) ? 'vi-VN' : 'en-US',
        provider: 'windows-sapi'
      }));
      localMapped.push({
        name: 'vi-google',
        fullName: 'Google Translate Vietnamese',
        friendlyName: 'Google Translate Vietnamese (fallback)',
        gender: 'Female',
        locale: 'vi-VN',
        provider: 'google-translate-tts'
      });
      return localMapped;
    }

    try {
      const edgeTTS = await this.getEdgeTTS();
      const voices = await edgeTTS.getVoices();
      return voices.map(v => ({
        name: v.ShortName,
        fullName: v.Name,
        friendlyName: v.FriendlyName,
        gender: v.Gender,
        locale: v.Locale,
        categories: v.VoiceTag?.ContentCategories || [],
        personalities: v.VoiceTag?.VoicePersonalities || [],
        provider: 'edge-tts'
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

  getSaySpeedFromRate(rate) {
    const multiplier = this.getRateMultiplier(rate);
    // Keep local TTS speed in a safe range.
    return Math.max(0.5, Math.min(2, Number(multiplier) || 1));
  }

  normalizeTextForSpeech(text) {
    if (!text) return '';
    return String(text)
      .replace(/[^\S\r\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async getPreferredLocalVoice(preferredVoice = '') {
    const localVoices = await this.getInstalledLocalVoices();
    if (!localVoices.length) return null;

    if (preferredVoice) {
      const matchedPreferred = localVoices.find((v) => v.toLowerCase() === preferredVoice.toLowerCase());
      if (matchedPreferred) return matchedPreferred;
    }

    const matchedVietnamese = localVoices.find((v) => /vietnam|vi-vn|microsoft an/i.test(v));
    if (matchedVietnamese) return matchedVietnamese;

    const matchedEnglish = localVoices.find((v) => /zira|david/i.test(v));
    return matchedEnglish || localVoices[0] || null;
  }

  async getInstalledLocalVoices() {
    if (Array.isArray(this.localVoices)) return this.localVoices;

    this.localVoices = await new Promise((resolve) => {
      say.getInstalledVoices((error, voices) => {
        if (error || !Array.isArray(voices)) return resolve([]);
        resolve(voices.filter(Boolean));
      });
    });
    return this.localVoices;
  }
}

module.exports = new TtsService();
