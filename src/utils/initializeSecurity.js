import db from '../config/database.js';

// Initialize security system
export const initializeSecurity = async () => {
  try {
    console.log('🔒 Initializing security system...');

    // 1. Add security columns to users table
    const userSecurityColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];

    for (const sql of userSecurityColumns) {
      try {
        await db.query(sql);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('Failed to add user security column:', error.message);
        }
      }
    }

    // 2. Create audit_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        endpoint VARCHAR(255),
        method VARCHAR(10),
        severity VARCHAR(20) DEFAULT 'LOW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 3. Create indexes for audit_logs
    const auditIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address)'
    ];

    for (const indexSql of auditIndexes) {
      try {
        await db.query(indexSql);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('Failed to create audit index:', error.message);
        }
      }
    }

    console.log('✅ Security system initialized successfully');
    console.log('   - User security columns added');
    console.log('   - Audit logging system created');

  } catch (error) {
    console.error('❌ Failed to initialize security system:', error);
    throw error;
  }
};

export default initializeSecurity;