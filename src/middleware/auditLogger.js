import db from '../config/database.js';

/**
 * Middleware to capture audit logs for critical database operations.
 * Extracts the user, IP, action, and automatically intercepts JSON responses to grab record IDs.
 */
export const auditLogger = (tableName, actionDescription) => {
  return async (req, res, next) => {
    // Intercept res.json to capture the response specifically looking for inserted IDs
    const originalJson = res.json;

    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Identify inserted/updated record ID dynamically if possible
          const recordId = data.id || req.params.id || null;

          const logData = {
            user_id: req.user?.id || null,
            user_role: req.user?.role || 'system',
            action: actionDescription || req.method,
            table_name: tableName,
            record_id: recordId,
            before_value: null, // Before values require explicit DB lookups before the transaction, usually handled specifically in controllers
            after_value: req.body ? JSON.stringify(req.body) : null,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          };

          if (logData.user_id) {
            db.query(
              `INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, before_value, after_value, ip_address, user_agent)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                logData.user_id, logData.user_role, logData.action,
                logData.table_name, logData.record_id, logData.before_value,
                logData.after_value, logData.ip_address, logData.user_agent
              ]
            ).catch(err => console.error('Audit Log failed to write:', err.message));
          }
        } catch (error) {
          console.error('Audit Log capture error:', error.message);
        }
      }

      // Call the original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};
