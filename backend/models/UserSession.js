const db = require('../config/database');

class UserSession {
  static async create(data) {
    const {
      user_id,
      refresh_token_hash,
      device_info = null,
      ip_address = null,
      user_agent = null,
      expires_at
    } = data;

    const [result] = await db.promise.query(
      `INSERT INTO user_sessions
       (user_id, refresh_token_hash, device_info, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, refresh_token_hash, device_info, ip_address, user_agent, expires_at]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await db.promise.query(
      `SELECT id, user_id, device_info, ip_address, user_agent, is_revoked, last_seen_at, expires_at, created_at
       FROM user_sessions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async revokeById(userId, sessionId) {
    const [result] = await db.promise.query(
      'UPDATE user_sessions SET is_revoked = TRUE WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
    return result.affectedRows > 0;
  }

  static async revokeAllByUserId(userId) {
    const [result] = await db.promise.query(
      'UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = ? AND is_revoked = FALSE',
      [userId]
    );
    return result.affectedRows;
  }

  static async touchById(userId, sessionId) {
    await db.promise.query(
      'UPDATE user_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
  }

  static async updateTokenHashById(sessionId, tokenHash) {
    await db.promise.query(
      'UPDATE user_sessions SET refresh_token_hash = ? WHERE id = ?',
      [tokenHash, sessionId]
    );
  }

  static async isSessionValid(userId, sessionId, tokenHash) {
    const [rows] = await db.promise.query(
      `SELECT id
       FROM user_sessions
       WHERE id = ?
         AND user_id = ?
         AND refresh_token_hash = ?
         AND is_revoked = FALSE
         AND expires_at > NOW()
       LIMIT 1`,
      [sessionId, userId, tokenHash]
    );
    return rows.length > 0;
  }
}

module.exports = UserSession;
