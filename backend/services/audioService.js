const ocrService = require('./ocrService');
const ttsService = require('./ttsService');
const ChapterAudio = require('../models/ChapterAudio');
const Chapter = require('../models/Chapter');

class AudioPipelineError extends Error {
  constructor(message, errorCode, statusCode = 500, details = null) {
    super(message);
    this.name = 'AudioPipelineError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
  }
}

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
      throw new AudioPipelineError('Chapter audio is already being processed', 'audio_in_progress', 409);
    }

    this.processingQueue.set(chapterId, true);

    try {
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        throw new AudioPipelineError('Chapter not found', 'chapter_not_found', 404);
      }

      if (chapter.images.length === 0) {
        throw new AudioPipelineError('Chapter has no images', 'chapter_has_no_images', 400);
      }

      let chapterAudio = await ChapterAudio.findByChapterId(chapterId);

      if (chapterAudio && !forceRecreate && chapterAudio.status === 'completed') {
        console.log(`📦 Chapter audio already exists: ${chapterAudio.audio_url}`);
        return {
          success: true,
          audio: chapterAudio,
          message: 'Chapter audio already exists',
          isNew: false,
          status: 'completed',
          provider: chapterAudio.provider || null
        };
      }

      if (chapterAudio && chapterAudio.audio_url) {
        await ttsService.deleteAudioFile(chapterAudio.audio_url.split('/').pop());
      }

      await ChapterAudio.updateByChapterId(chapterId, {
        status: 'processing',
        error_message: null,
        error_code: null
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
      const refinedText = await ocrService.refineTextWithAI(cleanedText);

      console.log(`\n✅ OCR completed. Extracted ${refinedText.length} characters`);

      if (!refinedText || refinedText.trim().length === 0) {
        throw new AudioPipelineError(
          'No text could be extracted from the chapter images',
          'ocr_empty_text',
          422
        );
      }

      console.log('\n🎤 Step 2: Converting text to audio (TTS)...');
      const ttsResult = await ttsService.textToSpeech(refinedText, {
        voice: voice,
        rate: rate,
        outputFilename: `chapter_${chapterId}_${Date.now()}.mp3`
      });

      console.log(`\n✅ TTS completed. Audio URL: ${ttsResult.url}`);

      const duration = ttsService.estimateDuration(refinedText, rate);

      const audioData = {
        chapter_id: chapterId,
        text_content: refinedText,
        audio_url: ttsResult.url,
        duration: duration,
        status: 'completed',
        error_message: null,
        error_code: null,
        provider: ttsResult.provider || null
      };

      if (chapterAudio) {
        await ChapterAudio.update(chapterAudio.id, audioData);
        chapterAudio = { ...chapterAudio, ...audioData };
      } else {
        const audioId = await ChapterAudio.create(audioData);
        chapterAudio = { id: audioId, ...audioData };
      }

      console.log(`\n🎉 Chapter audio created successfully!`);
      console.log(`   - Text length: ${refinedText.length} characters`);
      console.log(`   - Estimated duration: ${duration} seconds`);
      console.log(`   - Audio URL: ${ttsResult.url}`);

      return {
        success: true,
        audio: chapterAudio,
        ocrResults: ocrResults,
        ttsResult: ttsResult,
        message: 'Chapter audio created successfully',
        isNew: true,
        status: 'completed',
        provider: ttsResult.provider || null
      };

    } catch (error) {
      console.error(`\n❌ Error creating chapter audio:`, error);

      await ChapterAudio.updateByChapterId(chapterId, {
        status: 'failed',
        error_message: error.message,
        error_code: error.errorCode || this.mapUnknownErrorCode(error)
      });

      if (error instanceof AudioPipelineError) {
        throw error;
      }
      throw new AudioPipelineError(
        error.message || 'Audio pipeline failed',
        this.mapUnknownErrorCode(error),
        500
      );
    } finally {
      this.processingQueue.delete(chapterId);
    }
  }

  mapUnknownErrorCode(error) {
    const message = `${error?.message || ''}`.toLowerCase();
    if (message.includes('ocr')) return 'ocr_failed';
    if (message.includes('tts')) return 'tts_failed';
    if (message.includes('table') || message.includes('sql')) return 'storage_failed';
    return 'audio_pipeline_failed';
  }

  async getChapterAudio(chapterId) {
    const chapterAudio = await ChapterAudio.findByChapterId(chapterId);
    
    if (!chapterAudio) {
      return null;
    }

    return {
      ...chapterAudio,
      isReady: chapterAudio.status === 'completed',
      canPlay: chapterAudio.status === 'completed' && Boolean(chapterAudio.audio_url),
      provider: chapterAudio.provider || null
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
      canPlay: chapterAudio.status === 'completed' && Boolean(chapterAudio.audio_url),
      provider: chapterAudio.provider || null
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
    const voices = await ttsService.getAvailableVoices();
    const preferred = voices.find((v) => /vi-vn|vietnam|an/i.test(v.locale || v.name || '')) || voices[0];
    return {
      voice: preferred?.name || 'default',
      rate: '+10%',
      volume: '+0%',
      description: preferred
        ? `Giọng mặc định (${preferred.provider || 'local'})`
        : 'Giọng nói mặc định tiếng Việt'
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
        errorMessage: chapterAudio.error_message,
        errorCode: chapterAudio.error_code || null
      } : null
    };
  }

  async getReadiness(chapterId) {
    const chapterAudio = await ChapterAudio.findByChapterId(chapterId);
    if (!chapterAudio) {
      return {
        hasAudio: false,
        status: 'not_found',
        isReady: false,
        canPlay: false,
        audioUrl: null
      };
    }

    return {
      hasAudio: true,
      status: chapterAudio.status,
      isReady: chapterAudio.status === 'completed',
      canPlay: chapterAudio.status === 'completed' && Boolean(chapterAudio.audio_url),
      audioUrl: chapterAudio.audio_url || null,
      provider: chapterAudio.provider || null,
      errorCode: chapterAudio.error_code || null
    };
  }
}

module.exports = new AudioService();
