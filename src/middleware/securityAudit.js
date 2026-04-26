import db from '../config/database.js';

// Security audit logger
export class SecurityAudit {
  
  // Log authentication events
  static async logAuthEvent(eventType, userId, details = {}, req = null) {
    try {
      const auditData = {
        event_type: eventType,
        user_id: userId,
        ip_address: req?.ip || req?.connection?.remoteAddress || 'unknown',
        user_agent: req?.headers['user-agent'] || 'unknown',
        endpoint: req?.originalUrl || 'unknown',
        method: req?.method || 'unknown',
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
        severity: this.getSeverityLevel(eventType)
      };

      // Try to insert into audit_logs table
      try {
        await db.query(`
          INSERT INTO audit_logs (
            user_id, action, resource, details, ip_address, 
            user_agent, endpoint, method, severity, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          auditData.user_id,
          eventType,
          'security',
          auditData.details,
          auditData.ip_address,
          auditData.user_agent,
          auditData.endpoint,
          auditData.method,
          auditData.severity,
          auditData.timestamp
        ]);
      } catch (dbError) {
        // If audit_logs table doesn't exist, create it
        if (dbError.message.includes('does not exist')) {
          await this.createAuditTable();
          // Retry the insert
          await db.query(`
            INSERT INTO audit_logs (
              user_id, action, resource, details, ip_address, 
              user_agent, endpoint, method, severity, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            auditData.user_id,
            eventType,
            'security',
            auditData.details,
            auditData.ip_address,
            auditData.user_agent,
            auditData.endpoint,
            auditData.method,
            auditData.severity,
            auditData.timestamp
          ]);
        } else {
          console.error('Failed to log security event to database:', dbError);
          console.log('Security Event (Console):', auditData);
        }
      }

      // Also log critical events to console
      if (auditData.severity === 'HIGH' || auditData.severity === 'CRITICAL') {
        console.warn('🚨 SECURITY ALERT:', auditData);
      }

    } catch (error) {
      console.error('Security audit logging failed:', error);
    }
  }

  // Get severity level for different event types
  static getSeverityLevel(eventType) {
    const severityMap = {
      // Authentication events
      'LOGIN_SUCCESS': 'LOW',
      'LOGIN_FAILED': 'MEDIUM',
      'LOGIN_BLOCKED': 'HIGH',
      'LOGOUT': 'LOW',
      'TOKEN_EXPIRED': 'LOW',
      'TOKEN_INVALID': 'MEDIUM',
      'ACCOUNT_LOCKED': 'HIGH',
      'ACCOUNT_SUSPENDED': 'HIGH',
      
      // Authorization events
      'ACCESS_DENIED': 'MEDIUM',
      'PERMISSION_DENIED': 'MEDIUM',
      'RESOURCE_ACCESS_DENIED': 'MEDIUM',
      'FIELD_ACCESS_DENIED': 'MEDIUM',
      'STAGE_TRANSITION_DENIED': 'MEDIUM',
      'DOCUMENT_ACCESS_DENIED': 'MEDIUM',
      
      // Security violations
      'SUSPICIOUS_REQUEST': 'HIGH',
      'RATE_LIMIT_EXCEEDED': 'MEDIUM',
      'VALIDATION_FAILED': 'LOW',
      'AMOUNT_LIMIT_EXCEEDED': 'MEDIUM',
      'BUSINESS_RULE_VIOLATION': 'MEDIUM',
      
      // Data access events
      'DATA_EXPORT': 'MEDIUM',
      'BULK_OPERATION': 'MEDIUM',
      'ADMIN_ACTION': 'HIGH',
      'SYSTEM_CONFIG_CHANGE': 'HIGH',
      
      // Critical events
      'MULTIPLE_FAILED_LOGINS': 'CRITICAL',
      'PRIVILEGE_ESCALATION_ATTEMPT': 'CRITICAL',
      'SQL_INJECTION_ATTEMPT': 'CRITICAL',
      'XSS_ATTEMPT': 'CRITICAL'
    };

    return severityMap[eventType] || 'LOW';
  }

  // Create audit logs table if it doesn't exist
  static async createAuditTable() {
    try {
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
      
      // Create indexes for better performance
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
      `);
      
      console.log('✅ Audit logs table created successfully');
    } catch (error) {
      console.error('❌ Failed to create audit logs table:', error);
    }
  }
}

// Middleware to automatically log security events
export const securityAuditMiddleware = (eventType) => {
  return (req, res, next) => {
    // Log the event
    SecurityAudit.logAuthEvent(eventType, req.user?.id, {
      resource: req.params.id || req.body.id,
      action: req.method,
      endpoint: req.originalUrl
    }, req);
    
    next();
  };
};

export default SecurityAudit;