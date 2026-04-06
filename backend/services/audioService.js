const ocrService = require('./ocrService');
const ttsService = require('./ttsService');
const ChapterAudio = require('../models/ChapterAudio');
const Chapter = require('../models/Chapter');

class AudioService {
  constructor() {
    this.processingQueue = new Map();
  }

  async createChapterAudio(chapterId, options = {}) {
    const {
      voice = 'vi-VN-HonMyBellNeural',
      rate = '+10%',
      forceRecreate = false
    } = options;

    if (this.processingQueue.has(chapterId)) {
      throw new Error('Chapter audio is already being processed');
    }

    this.processingQueue.set(chapterId, true);

    try {
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      if (chapter.images.length === 0) {
        throw new Error('Chapter has no images');
      }

      let chapterAudio = await ChapterAudio.findByChapterId(chapterId);

      if (chapterAudio && !forceRecreate && chapterAudio.status === 'completed') {
        console.log(`📦 Chapter audio already exists: ${chapterAudio.audio_url}`);
        return {
          success: true,
          audio: chapterAudio,
          message: 'Chapter audio already exists',
          isNew: false
        };
      }

      if (chapterAudio && chapterAudio.audio_url) {
        await ttsService.deleteAudioFile(chapterAudio.audio_url.split('/').pop());
      }

      await ChapterAudio.updateByChapterId(chapterId, {
        status: 'processing',
        error_message: null
      });

      console.log(`\n🚀 Starting audio creation for chapter ${chapterId}`);
      console.log(`📖 Chapter: ${chapter.title || `Chapter ${chapter.chapter_number}`}`);
      console.log(`🖼️ Number of images: ${chapter.images.length}`);

      console.log('\n📝 Step 1: Extracting text from images (OCR)...');
      const ocrResults = await ocrService.extractTextFromMultipleImages(
        chapter.images,
        (progress) => {
          console.log(`   OCR Progress: ${progress.current}/${progress.total} pages processed`);
        }
      );

      const extractedText = ocrService.combineTexts(ocrResults);
      const cleanedText = ocrService.cleanText(extractedText);

      console.log(`\n✅ OCR completed. Extracted ${cleanedText.length} characters`);

      if (!cleanedText || cleanedText.trim().length === 0) {
        throw new Error('No text could be extracted from the chapter images');
      }

      console.log('\n🎤 Step 2: Converting text to audio (TTS)...');
      const ttsResult = await ttsService.textToSpeech(cleanedText, {
        voice: voice,
        rate: rate,
        outputFilename: `chapter_${chapterId}_${Date.now()}.mp3`
      });

      console.log(`\n✅ TTS completed. Audio URL: ${ttsResult.url}`);

      const duration = ttsService.estimateDuration(cleanedText, rate);

      const audioData = {
        chapter_id: chapterId,
        text_content: cleanedText,
        audio_url: ttsResult.url,
        duration: duration,
        status: 'completed',
        error_message: null
      };

      if (chapterAudio) {
        await ChapterAudio.update(chapterAudio.id, audioData);
        chapterAudio = { ...chapterAudio, ...audioData };
      } else {
        const audioId = await ChapterAudio.create(audioData);
        chapterAudio = { id: audioId, ...audioData };
      }

      console.log(`\n🎉 Chapter audio created successfully!`);
      console.log(`   - Text length: ${cleanedText.length} characters`);
      console.log(`   - Estimated duration: ${duration} seconds`);
      console.log(`   - Audio URL: ${ttsResult.url}`);

      return {
        success: true,
        audio: chapterAudio,
        ocrResults: ocrResults,
        ttsResult: ttsResult,
        message: 'Chapter audio created successfully',
        isNew: true
      };

    } catch (error) {
      console.error(`\n❌ Error creating chapter audio:`, error);

      await ChapterAudio.updateByChapterId(chapterId, {
        status: 'failed',
        error_message: error.message
      });

      throw error;
    } finally {
      this.processingQueue.delete(chapterId);
    }
  }

  async getChapterAudio(chapterId) {
    const chapterAudio = await ChapterAudio.findByChapterId(chapterId);
    
    if (!chapterAudio) {
      return null;
    }

    return {
      ...chapterAudio,
      isReady: chapterAudio.status === 'completed',
      canPlay: chapterAudio.status === 'completed' && chapterAudio.audio_url
    };
  }

  async getChapterAudioWithDetails(chapterId) {
    const chapterAudio = await ChapterAudio.findByChapterId(chapterId);
    
    if (!chapterAudio) {
      return null;
    }

    const chapter = await Chapter.findById(chapterId);

    return {
      ...chapterAudio,
      chapter: chapter ? {
        id: chapter.id,
        chapter_number: chapter.chapter_number,
        title: chapter.title
      } : null,
      isReady: chapterAudio.status === 'completed',
      canPlay: chapterAudio.status === 'completed' && chapterAudio.audio_url
    };
  }

  async deleteChapterAudio(chapterId) {
    const chapterAudio = await ChapterAudio.findByChapterId(chapterId);
    
    if (!chapterAudio) {
      return { success: true, message: 'No audio found for this chapter' };
    }

    if (chapterAudio.audio_url) {
      const filename = chapterAudio.audio_url.split('/').pop();
      await ttsService.deleteAudioFile(filename);
    }

    await ChapterAudio.deleteByChapterId(chapterId);

    return {
      success: true,
      message: 'Chapter audio deleted successfully'
    };
  }

  async getAvailableVoices() {
    return ttsService.getAvailableVoices();
  }

  async getDefaultVoice() {
    return {
      voice: 'vi-VN-HonMyBellNeural',
      rate: '+10%',
      volume: '+0%',
      description: 'Giọng nói mặc định tiếng Việt'
    };
  }

  isProcessing(chapterId) {
    return this.processingQueue.has(chapterId);
  }

  async getProcessingStatus(chapterId) {
    const chapterAudio = await ChapterAudio.findByChapterId(chapterId);
    
    return {
      chapterId,
      isProcessing: this.processingQueue.has(chapterId),
      status: chapterAudio?.status || null,
      progress: chapterAudio ? {
        createdAt: chapterAudio.created_at,
        updatedAt: chapterAudio.updated_at,
        errorMessage: chapterAudio.error_message
      } : null
    };
  }
}

module.exports = new AudioService();
