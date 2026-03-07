import db from '../config/database.js';

export const auditLog = (action, tableName = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      if (res.statusCode < 400) {
        const logData = {
          user_id: req.user?.id,
          user_role: req.user?.role,
          action,
          table_name: tableName,
          record_id: data.id || req.params.id || null,
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        };

        db.query(
          `INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [logData.user_id, logData.user_role, logData.action, logData.table_name, logData.record_id, logData.ip_address, logData.user_agent]
        ).catch(err => console.error('Audit log failed:', err));
      }
      
      return originalJson(data);
    };
    
    next();
  };
};
