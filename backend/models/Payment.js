const db = require('../config/database');

class Payment {
  static async create(data) {
    const { user_id, order_id, amount, payment_type, qr_code_url, qr_code_data, expires_at } = data;
    
    try {
      const [result] = await db.promise.query(
        `INSERT INTO payments (user_id, order_id, amount, payment_type, qr_code_url, qr_code_data, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, order_id, amount, payment_type, qr_code_url, qr_code_data, expires_at]
      );
      
      if (result.insertId) {
        console.log(`✅ Payment created in database: ID=${result.insertId}, order_id=${order_id}, user_id=${user_id}`);
      } else {
        console.error(`❌ Payment creation returned no insertId: order_id=${order_id}`);
      }
      
      return result.insertId;
    } catch (error) {
      console.error(`❌ Error creating payment in database: order_id=${order_id}`, error);
      throw error;
    }
  }

  static async findByOrderId(order_id) {
    const [payments] = await db.promise.query(
      'SELECT * FROM payments WHERE order_id = ?',
      [order_id]
    );
    return payments[0] || null;
  }

  static async findById(id) {
    const [payments] = await db.promise.query(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );
    return payments[0] || null;
  }

  static async findByUserId(user_id, params = {}) {
    const { status, limit = 10, offset = 0 } = params;
    
    let query = 'SELECT * FROM payments WHERE user_id = ?';
    const values = [user_id];
    
    if (status) {
      query += ' AND status = ?';
      values.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);
    
    const [payments] = await db.promise.query(query, values);
    return payments;
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
      `UPDATE payments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async updateByOrderId(order_id, data) {
    const fields = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      console.warn(`⚠️ No fields to update for payment: ${order_id}`);
      return null;
    }

    values.push(order_id);
    try {
      const [result] = await db.promise.query(
        `UPDATE payments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`,
        values
      );
      
      const success = result.affectedRows > 0;
      if (success) {
        console.log(`✅ Payment updated in database: order_id=${order_id}, fields=${Object.keys(data).join(', ')}`);
      } else {
        console.warn(`⚠️ Payment update affected 0 rows: order_id=${order_id}`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Error updating payment in database: order_id=${order_id}`, error);
      throw error;
    }
  }

  static async findPendingExpired() {
    const [payments] = await db.promise.query(
      'SELECT * FROM payments WHERE status = ? AND expires_at < NOW()',
      ['pending']
    );
    return payments;
  }

  static async expirePendingPayments() {
    const [result] = await db.promise.query(
      'UPDATE payments SET status = ? WHERE status = ? AND expires_at < NOW()',
      ['expired', 'pending']
    );
    return result.affectedRows;
  }
}

module.exports = Payment;

