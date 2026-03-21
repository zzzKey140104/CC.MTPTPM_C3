const db = require('../config/database');

class User {
  static async findByEmail(email) {
    const [users] = await db.promise.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  static async findByIdWithStatus(id) {
    const [users] = await db.promise.query(
      'SELECT id, username, email, avatar, role, account_status, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  static async findById(id) {
    const [users] = await db.promise.query(
      'SELECT id, username, email, avatar, role, account_status, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  static async create(data) {
    const { username, email, password, avatar, email_verification_token, google_id, email_verified } = data;
    
    // Xây dựng query động để chỉ insert password khi có giá trị
    // Điều này cho phép Google OAuth accounts không cần password
    const fields = ['username', 'email'];
    const values = [username, email];
    const placeholders = ['?', '?'];
    
    // Chỉ thêm password nếu có giá trị (không phải null/undefined)
    if (password !== undefined && password !== null) {
      fields.push('password');
      values.push(password);
      placeholders.push('?');
    }
    
    // Các field khác
    if (avatar !== undefined && avatar !== null) {
      fields.push('avatar');
      values.push(avatar);
      placeholders.push('?');
    }
    
    if (email_verification_token !== undefined && email_verification_token !== null) {
      fields.push('email_verification_token');
      values.push(email_verification_token);
      placeholders.push('?');
    }
    
    if (google_id !== undefined && google_id !== null) {
      fields.push('google_id');
      values.push(google_id);
      placeholders.push('?');
    }
    
    if (email_verified !== undefined) {
      fields.push('email_verified');
      values.push(email_verified);
      placeholders.push('?');
    }
    
    const query = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const [result] = await db.promise.query(query, values);
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.promise.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async emailExists(email) {
    const [users] = await db.promise.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    return users.length > 0;
  }

  static async findAll(params = {}) {
    const { page = 1, limit = 20, search = '' } = params;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, username, email, avatar, role, account_status, created_at FROM users';
    const values = [];

    if (search) {
      query += ' WHERE username LIKE ? OR email LIKE ?';
      const like = `%${search}%`;
      values.push(like, like);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    const [users] = await db.promise.query(query, values);
    return users;
  }

  static async count(params = {}) {
    const { search = '' } = params;

    let query = 'SELECT COUNT(*) AS total FROM users';
    const values = [];

    if (search) {
      query += ' WHERE username LIKE ? OR email LIKE ?';
      const like = `%${search}%`;
      values.push(like, like);
    }

    const [rows] = await db.promise.query(query, values);
    return rows[0]?.total || 0;
  }

  static async delete(id) {
    const [result] = await db.promise.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findAllAdmins() {
    const [admins] = await db.promise.query(
      'SELECT id, username, email FROM users WHERE role = ?',
      ['admin']
    );
    return admins;
  }

  static async findByGoogleId(googleId) {
    const [users] = await db.promise.query(
      'SELECT * FROM users WHERE google_id = ?',
      [googleId]
    );
    return users[0] || null;
  }

  static async findByVerificationToken(token) {
    const [users] = await db.promise.query(
      'SELECT * FROM users WHERE email_verification_token = ?',
      [token]
    );
    return users[0] || null;
  }

  static async findByPasswordResetToken(token) {
    const [users] = await db.promise.query(
      'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );
    return users[0] || null;
  }

  static async verifyEmail(userId) {
    const [result] = await db.promise.query(
      'UPDATE users SET email_verified = TRUE, email_verification_token = NULL WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }

  static async setPasswordResetToken(userId, token, expiresAt) {
    const [result] = await db.promise.query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [token, expiresAt, userId]
    );
    return result.affectedRows > 0;
  }

  static async clearPasswordResetToken(userId) {
    const [result] = await db.promise.query(
      'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;

