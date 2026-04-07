const db = require('../config/database');

class AIUsageStatsDaily {
  static async upsertDailyUsage(data) {
    const {
      user_id,
      date,
      chat_count = 0,
      summary_count = 0,
      estimated_input_tokens = 0,
      estimated_output_tokens = 0,
      estimated_cost = 0
    } = data;

    await db.promise.query(
      `INSERT INTO ai_usage_stats_daily
       (user_id, date, chat_count, summary_count, estimated_input_tokens, estimated_output_tokens, estimated_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         chat_count = chat_count + VALUES(chat_count),
         summary_count = summary_count + VALUES(summary_count),
         estimated_input_tokens = estimated_input_tokens + VALUES(estimated_input_tokens),
         estimated_output_tokens = estimated_output_tokens + VALUES(estimated_output_tokens),
         estimated_cost = estimated_cost + VALUES(estimated_cost),
         updated_at = CURRENT_TIMESTAMP`,
      [
        user_id,
        date,
        chat_count,
        summary_count,
        estimated_input_tokens,
        estimated_output_tokens,
        estimated_cost
      ]
    );
  }

  static async findByDateRange(userId, fromDate, toDate) {
    const [rows] = await db.promise.query(
      `SELECT date, chat_count, summary_count, estimated_input_tokens, estimated_output_tokens, estimated_cost
       FROM ai_usage_stats_daily
       WHERE user_id = ? AND date BETWEEN ? AND ?
       ORDER BY date DESC`,
      [userId, fromDate, toDate]
    );
    return rows;
  }

  static async getSummary(userId) {
    const [rows] = await db.promise.query(
      `SELECT
         COALESCE(SUM(chat_count), 0) AS total_chat_count,
         COALESCE(SUM(summary_count), 0) AS total_summary_count,
         COALESCE(SUM(estimated_input_tokens), 0) AS total_input_tokens,
         COALESCE(SUM(estimated_output_tokens), 0) AS total_output_tokens,
         COALESCE(SUM(estimated_cost), 0) AS total_estimated_cost
       FROM ai_usage_stats_daily
       WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }
}

module.exports = AIUsageStatsDaily;
