const audioService = require('../services/audioService');
const Chapter = require('../models/Chapter');
const Comic = require('../models/Comic');
const { successResponse, errorResponse } = require('../utils/response');

class AudioController {
  async getChapterAudio(req, res) {
    try {
      const { chapterId } = req.params;

      const chapterAudio = await audioService.getChapterAudioWithDetails(chapterId);

      if (!chapterAudio) {
        return successResponse(res, {
          hasAudio: false,
          audio: null,
          isReady: false
        });
      }

      return successResponse(res, {
        hasAudio: true,
        audio: chapterAudio,
        isReady: chapterAudio.status === 'completed',
        canPlay: chapterAudio.canPlay
      });
    } catch (error) {
      console.error('Error getting chapter audio:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async createChapterAudio(req, res) {
    try {
      const { chapterId } = req.params;
      const { voice, rate, forceRecreate } = req.body;

      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return errorResponse(res, 'Không tìm thấy chương', 404);
      }

      if (chapter.images.length === 0) {
        return errorResponse(res, 'Chương không có hình ảnh để tạo audio', 400);
      }

      if (audioService.isProcessing(chapterId)) {
        return errorResponse(res, 'Chương đang được xử lý audio', 409);
      }

      const result = await audioService.createChapterAudio(chapterId, {
        voice: voice || 'vi-VN-HonMyBellNeural',
        rate: rate || '+10%',
        forceRecreate: forceRecreate || false
      });

      return successResponse(res, {
        message: result.message,
        audio: result.audio,
        isNew: result.isNew,
        textLength: result.audio?.text_content?.length || 0,
        duration: result.audio?.duration || 0
      });

    } catch (error) {
      console.error('Error creating chapter audio:', error);
      return errorResponse(res, error.message || 'Lỗi server', 500);
    }
  }

  async deleteChapterAudio(req, res) {
    try {
      const { chapterId } = req.params;

      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return errorResponse(res, 'Không tìm thấy chương', 404);
      }

      const result = await audioService.deleteChapterAudio(chapterId);

      return successResponse(res, result);
    } catch (error) {
      console.error('Error deleting chapter audio:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getProcessingStatus(req, res) {
    try {
      const { chapterId } = req.params;

      const status = await audioService.getProcessingStatus(chapterId);

      return successResponse(res, status);
    } catch (error) {
      console.error('Error getting processing status:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async getAvailableVoices(req, res) {
    try {
      const voices = await audioService.getAvailableVoices();

      return successResponse(res, {
        voices,
        defaultVoice: await audioService.getDefaultVoice()
      });
    } catch (error) {
      console.error('Error getting available voices:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }

  async generateAudioForComicChapters(req, res) {
    try {
      const { comicId } = req.params;
      const { 
        voice, 
        rate, 
        startChapter, 
        endChapter,
        chaptersList
      } = req.body;

      const comic = await Comic.findById(comicId);
      if (!comic) {
        return errorResponse(res, 'Không tìm thấy truyện', 404);
      }

      const chapters = await Chapter.findByComicId(comicId, false, false);
      
      let targetChapters = chapters;
      
      if (chaptersList && Array.isArray(chaptersList)) {
        targetChapters = chapters.filter(ch => chaptersList.includes(ch.id));
      } else if (startChapter && endChapter) {
        targetChapters = chapters.filter(
          ch => ch.chapter_number >= startChapter && ch.chapter_number <= endChapter
        );
      }

      if (targetChapters.length === 0) {
        return errorResponse(res, 'Không có chương nào để tạo audio', 400);
      }

      const results = [];
      const errors = [];

      for (const chapter of targetChapters) {
        try {
          if (audioService.isProcessing(chapter.id)) {
            results.push({
              chapterId: chapter.id,
              chapterNumber: chapter.chapter_number,
              status: 'skipped',
              message: 'Already being processed'
            });
            continue;
          }

          const existingAudio = await audioService.getChapterAudio(chapter.id);
          if (existingAudio && existingAudio.status === 'completed' && !forceRecreate) {
            results.push({
              chapterId: chapter.id,
              chapterNumber: chapter.chapter_number,
              status: 'skipped',
              message: 'Audio already exists'
            });
            continue;
          }

          const result = await audioService.createChapterAudio(chapter.id, {
            voice: voice || 'vi-VN-HonMyBellNeural',
            rate: rate || '+10%',
            forceRecreate: true
          });

          results.push({
            chapterId: chapter.id,
            chapterNumber: chapter.chapter_number,
            status: 'completed',
            audioUrl: result.audio?.audio_url,
            duration: result.audio?.duration
          });
        } catch (error) {
          errors.push({
            chapterId: chapter.id,
            chapterNumber: chapter.chapter_number,
            error: error.message
          });
        }
      }

      return successResponse(res, {
        total: targetChapters.length,
        completed: results.filter(r => r.status === 'completed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: errors.length,
        results,
        errors
      });

    } catch (error) {
      console.error('Error generating audio for comic chapters:', error);
      return errorResponse(res, 'Lỗi server', 500);
    }
  }
}

module.exports = new AudioController();
