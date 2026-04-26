import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export const roleHierarchy = {
  admin: 6,
  ops_team: 5,
  sales_manager: 5,
  manager: 4,
  branch_manager: 4,
  dsa: 3,
  team_leader: 2,
  executive: 1,
  accountant: 1
};

export const hasMinimumRole = (userRole, requiredRole) => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Enhanced authentication middleware with session validation
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No token provided',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify user still exists and is active
    const userResult = await db.query(
      'SELECT id, phone, full_name as name, role, status, branch_id, reporting_to, last_login, failed_login_attempts FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact administrator.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Check for account lockout due to failed attempts
    if (user.failed_login_attempts >= 5) {
      return res.status(403).json({ 
        error: 'Account locked',
        message: 'Account locked due to multiple failed login attempts. Please contact administrator.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Add IP tracking for security
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    req.user = {
      ...user,
      clientIP,
      tokenIssuedAt: decoded.iat
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please login again',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Token is malformed or invalid',
        code: 'INVALID_TOKEN'
      });
    }
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Unable to authenticate request',
      code: 'AUTH_FAILED'
    });
  }
};

// Role-based authorization
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

// Minimum role authorization
export const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User not authenticated' 
      });
    }

    if (!hasMinimumRole(req.user.role, minimumRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires ${minimumRole} role or higher. Your role: ${req.user.role}`,
        userRole: req.user.role,
        requiredRole: minimumRole
      });
    }
    next();
  };
};

// Resource ownership validation
export const validateResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admin can access everything
      if (userRole === 'admin') {
        return next();
      }

      let query = '';
      let params = [resourceId];

      switch (resourceType) {
        case 'loan':
          // Check if user created the loan or it's from their lead
          query = `
            SELECT l.id, l.created_by, l.assigned_to, l.lead_id
            FROM loans l
            WHERE l.id = $1 AND (
              l.created_by = $2 
              OR l.assigned_to = $2
              OR l.lead_id IN (SELECT id FROM leads WHERE created_by = $2 OR assigned_to = $2)
            )
          `;
          params.push(userId);
          break;

        case 'lead':
          query = `
            SELECT id, created_by, assigned_to 
            FROM leads 
            WHERE id = $1 AND (created_by = $2 OR assigned_to = $2)
          `;
          params.push(userId);
          break;

        default:
          return res.status(400).json({ 
            error: 'Invalid resource type',
            message: 'Resource validation not configured' 
          });
      }

      const result = await db.query(query, params);

      if (result.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have permission to access this resource' 
        });
      }

      req.resource = result.rows[0];
      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Authorization check failed',
        message: error.message 
      });
    }
  };
};

// Team hierarchy validation
export const validateTeamAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const targetUserId = req.params.userId || req.body.userId;

    // Admin can access everything
    if (userRole === 'admin') {
      return next();
    }

    // If no target user specified, allow (for own data)
    if (!targetUserId || targetUserId == userId) {
      return next();
    }

    // Check if target user is in requester's team hierarchy
    const hierarchyQuery = `
      WITH RECURSIVE team_hierarchy AS (
        SELECT id, reporting_to FROM users WHERE id = $1
        UNION ALL
        SELECT u.id, u.reporting_to FROM users u
        INNER JOIN team_hierarchy t ON u.reporting_to = t.id
      )
      SELECT COUNT(*) as count FROM team_hierarchy WHERE id = $2
    `;

    const result = await db.query(hierarchyQuery, [userId, targetUserId]);
    const hasAccess = parseInt(result.rows[0].count) > 0;

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only access data for users in your team' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Team access validation failed',
      message: error.message 
    });
  }
};

// Permission-based authorization
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admin has all permissions
      if (userRole === 'admin') {
        return next();
      }

      // Check user permissions from database
      const permissionQuery = `
        SELECT p.permission_name 
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = $1 AND p.permission_name = $2
        UNION
        SELECT p.permission_name 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = $3 AND p.permission_name = $2
      `;

      const result = await db.query(permissionQuery, [userId, permission, userRole]);

      if (result.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Permission denied',
          message: `This action requires '${permission}' permission` 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: error.message 
      });
    }
  };
};

// Data filtering based on user role and hierarchy with enhanced security
export const applyDataFilters = (req, res, next) => {
  const userRole = req.user.role;
  const userId = req.user.id;
  const branchId = req.user.branch_id;

  // Add filters to request for use in controllers
  req.dataFilters = {
    userId,
    userRole,
    branchId,
    
    // Generate SQL filters based on role with enhanced security
    getLoanFilter: () => {
      switch (userRole) {
        case 'admin':
          return { sql: '', params: [] };
        
        case 'executive':
          return {
            sql: `AND (l.created_by = $1 OR l.assigned_to = $1 OR l.lead_id IN (SELECT id FROM leads WHERE created_by = $1 OR assigned_to = $1))`,
            params: [userId]
          };
        
        case 'team_leader':
          return {
            sql: `AND (l.created_by = $1 OR l.created_by IN (SELECT id FROM users WHERE reporting_to = $1))`,
            params: [userId]
          };
        
        case 'manager':
        case 'sales_manager':
        case 'dsa':
        case 'branch_manager':
          return {
            sql: `AND (l.created_by IN (
              WITH RECURSIVE team_hierarchy AS (
                SELECT id FROM users WHERE reporting_to = $1 OR id = $1
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN team_hierarchy t ON u.reporting_to = t.id
              )
              SELECT id FROM team_hierarchy
            ) OR l.assigned_to = $1)`,
            params: [userId]
          };
        
        case 'accountant':
          return {
            sql: `AND l.application_stage IN ('APPROVED', 'DISBURSED')`,
            params: []
          };
        
        default:
          return {
            sql: `AND l.created_by = $1`,
            params: [userId]
          };
      }
    },

    getLeadFilter: () => {
      switch (userRole) {
        case 'admin':
          return { sql: '', params: [] };
        
        case 'executive':
          return {
            sql: `AND (created_by = $1 OR assigned_to = $1)`,
            params: [userId]
          };
        
        case 'team_leader':
          return {
            sql: `AND (created_by = $1 OR created_by IN (SELECT id FROM users WHERE reporting_to = $1))`,
            params: [userId]
          };
        
        case 'manager':
        case 'sales_manager':
        case 'branch_manager':
          return {
            sql: `AND created_by IN (
              WITH RECURSIVE team_hierarchy AS (
                SELECT id FROM users WHERE reporting_to = $1 OR id = $1
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN team_hierarchy t ON u.reporting_to = t.id
              )
              SELECT id FROM team_hierarchy
            )`,
            params: [userId]
          };
        
        default:
          return {
            sql: `AND created_by = $1`,
            params: [userId]
          };
      }
    },

    getUserFilter: () => {
      switch (userRole) {
        case 'admin':
          return { sql: '', params: [] };
        
        case 'sales_manager':
        case 'branch_manager':
          return {
            sql: `AND (reporting_to = $1 OR id = $1 OR id IN (
              WITH RECURSIVE team_hierarchy AS (
                SELECT id FROM users WHERE reporting_to = $1
                UNION ALL
                SELECT u.id FROM users u
                INNER JOIN team_hierarchy t ON u.reporting_to = t.id
              )
              SELECT id FROM team_hierarchy
            ))`,
            params: [userId]
          };
        
        default:
          return {
            sql: `AND id = $1`,
            params: [userId]
          };
      }
    }
  };

  next();
};

// Rate limiting per user role
export const rateLimitByRole = (limits = {}) => {
  const defaultLimits = {
    admin: 1000,
    sales_manager: 500,
    branch_manager: 300,
    dsa: 200,
    team_leader: 100,
    executive: 50
  };

  const userLimits = { ...defaultLimits, ...limits };

  return (req, res, next) => {
    const userRole = req.user?.role;
    const limit = userLimits[userRole] || 10;

    // Simple in-memory rate limiting (in production, use Redis)
    const key = `${req.user.id}_${req.route?.path || req.path}`;
    
    // This is a simplified implementation
    // In production, implement proper rate limiting with Redis
    req.rateLimit = {
      limit,
      remaining: limit - 1
    };

    next();
  };
};

// Security audit logging
export const auditSecurityEvent = async (req, eventType, details = {}) => {
  try {
    const auditData = {
      user_id: req.user?.id || null,
      event_type: eventType,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString()
    };

    // Log to database if audit_logs table exists
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [auditData.user_id, eventType, 'security', auditData.details, auditData.ip_address, auditData.user_agent, auditData.timestamp]
      );
    } catch (dbError) {
      // If audit_logs table doesn't exist, just log to console
      console.log('Security Event:', auditData);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Enhanced security middleware that logs suspicious activities
export const securityMonitor = (req, res, next) => {
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Code execution
    /eval\(/i // Code evaluation
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      auditSecurityEvent(req, 'SUSPICIOUS_REQUEST', {
        pattern: pattern.toString(),
        data: requestData
      });
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request contains potentially malicious content'
      });
    }
  }

  next();
};

export default {
  authenticate,
  authorize,
  requireMinimumRole,
  validateResourceOwnership,
  validateTeamAccess,
  requirePermission,
  applyDataFilters,
  rateLimitByRole,
  auditSecurityEvent,
  securityMonitor,
  hasMinimumRole,
  roleHierarchy
};