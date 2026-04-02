const db = require('../config/database');

class AIUsageLog {
  static async create(data) {
    const {
      user_id = null,
      comic_id = null,
      chapter_id = null,
      action,
      prompt_chars = 0,
      response_chars = 0,
      model_name = 'gemini-2.5-flash',
      is_success = true,
      error_message = null
    } = data;

    await db.promise.query(
      `INSERT INTO ai_usage_logs
      (user_id, comic_id, chapter_id, action, prompt_chars, response_chars, model_name, is_success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        comic_id,
        chapter_id,
        action,
        prompt_chars,
        response_chars,
        model_name,
        is_success ? 1 : 0,
        error_message
      ]
    );
  }
}

module.exports = AIUsageLog;
