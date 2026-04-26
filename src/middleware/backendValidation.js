import db from '../config/database.js';
import { roleHierarchy } from './enhancedAuth.js';

// Comprehensive backend validation middleware
export const validateBackendSecurity = {
  
  // Validate user permissions for specific actions
  validateUserAction: (requiredPermission) => {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admin bypass
        if (userRole === 'admin') {
          return next();
        }

        // Check if user has specific permission
        const permissionCheck = await db.query(`
          SELECT EXISTS(
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role = $1 AND p.permission_name = $2 AND rp.granted = true
            UNION
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = $3 AND p.permission_name = $2 AND up.granted = true
          ) as has_permission
        `, [userRole, requiredPermission, userId]);

        if (!permissionCheck.rows[0].has_permission) {
          return res.status(403).json({
            error: 'Permission denied',
            message: `Action requires '${requiredPermission}' permission`,
            code: 'INSUFFICIENT_PERMISSIONS'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          error: 'Permission validation failed',
          message: error.message
        });
      }
    };
  },

  // Validate data access based on user hierarchy
  validateDataAccess: (resourceType) => {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const resourceId = req.params.id;

        // Admin can access everything
        if (userRole === 'admin') {
          return next();
        }

        let accessQuery = '';
        let params = [resourceId, userId];

        switch (resourceType) {
          case 'loan':
            accessQuery = `
              SELECT EXISTS(
                SELECT 1 FROM loans l
                WHERE l.id = $1 AND (
                  l.created_by = $2 
                  OR l.assigned_to = $2
                  OR l.lead_id IN (SELECT id FROM leads WHERE created_by = $2 OR assigned_to = $2)
                  OR ($3 IN ('sales_manager', 'branch_manager') AND l.created_by IN (
                    WITH RECURSIVE team_hierarchy AS (
                      SELECT id FROM users WHERE reporting_to = $2 OR id = $2
                      UNION ALL
                      SELECT u.id FROM users u
                      INNER JOIN team_hierarchy t ON u.reporting_to = t.id
                    )
                    SELECT id FROM team_hierarchy
                  ))
                )
              ) as has_access
            `;
            params.push(userRole);
            break;

          case 'lead':
            accessQuery = `
              SELECT EXISTS(
                SELECT 1 FROM leads l
                WHERE l.id = $1 AND (
                  l.created_by = $2 
                  OR l.assigned_to = $2
                  OR ($3 IN ('sales_manager', 'branch_manager') AND l.created_by IN (
                    WITH RECURSIVE team_hierarchy AS (
                      SELECT id FROM users WHERE reporting_to = $2 OR id = $2
                      UNION ALL
                      SELECT u.id FROM users u
                      INNER JOIN team_hierarchy t ON u.reporting_to = t.id
                    )
                    SELECT id FROM team_hierarchy
                  ))
                )
              ) as has_access
            `;
            params.push(userRole);
            break;

          case 'user':
            accessQuery = `
              SELECT EXISTS(
                SELECT 1 FROM users u
                WHERE u.id = $1 AND (
                  u.id = $2
                  OR ($3 IN ('sales_manager', 'branch_manager') AND (
                    u.reporting_to = $2 
                    OR u.id IN (
                      WITH RECURSIVE team_hierarchy AS (
                        SELECT id FROM users WHERE reporting_to = $2
                        UNION ALL
                        SELECT u2.id FROM users u2
                        INNER JOIN team_hierarchy t ON u2.reporting_to = t.id
                      )
                      SELECT id FROM team_hierarchy
                    )
                  ))
                )
              ) as has_access
            `;
            params.push(userRole);
            break;

          default:
            return res.status(400).json({
              error: 'Invalid resource type',
              message: 'Resource validation not configured'
            });
        }

        const result = await db.query(accessQuery, params);

        if (!result.rows[0].has_access) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have permission to access this resource',
            code: 'RESOURCE_ACCESS_DENIED'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          error: 'Access validation failed',
          message: error.message
        });
      }
    };
  },

  // Validate field-level permissions
  validateFieldAccess: (fields = []) => {
    return async (req, res, next) => {
      try {
        const userRole = req.user.role;
        const userId = req.user.id;

        // Admin can access all fields
        if (userRole === 'admin') {
          return next();
        }

        // Get user's field permissions
        const fieldPermissions = await db.query(`
          SELECT field_name, can_view, can_edit
          FROM field_permissions
          WHERE role = $1 OR user_id = $2
        `, [userRole, userId]);

        const permissions = {};
        fieldPermissions.rows.forEach(perm => {
          permissions[perm.field_name] = {
            canView: perm.can_view,
            canEdit: perm.can_edit
          };
        });

        // Check if user can access requested fields
        for (const field of fields) {
          if (permissions[field] && !permissions[field].canView) {
            return res.status(403).json({
              error: 'Field access denied',
              message: `You do not have permission to access field: ${field}`,
              code: 'FIELD_ACCESS_DENIED'
            });
          }
        }

        // Add field permissions to request for controller use
        req.fieldPermissions = permissions;
        next();
      } catch (error) {
        return res.status(500).json({
          error: 'Field validation failed',
          message: error.message
        });
      }
    };
  },

  // Validate business rules
  validateBusinessRules: (ruleType) => {
    return async (req, res, next) => {
      try {
        const userRole = req.user.role;
        const userId = req.user.id;

        switch (ruleType) {
          case 'loan_amount_limit':
            const maxLoanAmount = await db.query(`
              SELECT config_value FROM system_config 
              WHERE config_key = $1
            `, [`max_loan_amount_${userRole}`]);

            if (maxLoanAmount.rows.length > 0) {
              const limit = parseFloat(maxLoanAmount.rows[0].config_value);
              const requestedAmount = parseFloat(req.body.loan_amount || 0);

              if (requestedAmount > limit) {
                return res.status(403).json({
                  error: 'Amount limit exceeded',
                  message: `Maximum loan amount for ${userRole} is ${limit}`,
                  code: 'AMOUNT_LIMIT_EXCEEDED'
                });
              }
            }
            break;

          case 'stage_transition':
            const currentStage = req.body.current_stage;
            const newStage = req.body.application_stage;

            // Check if user can perform this stage transition
            const stagePermission = await db.query(`
              SELECT can_transition FROM stage_permissions
              WHERE role = $1 AND from_stage = $2 AND to_stage = $3
            `, [userRole, currentStage, newStage]);

            if (stagePermission.rows.length === 0 || !stagePermission.rows[0].can_transition) {
              return res.status(403).json({
                error: 'Stage transition denied',
                message: `Cannot transition from ${currentStage} to ${newStage}`,
                code: 'STAGE_TRANSITION_DENIED'
              });
            }
            break;

          case 'document_access':
            // Validate document access based on loan/lead ownership
            const documentId = req.params.documentId || req.body.document_id;
            if (documentId) {
              const docAccess = await db.query(`
                SELECT EXISTS(
                  SELECT 1 FROM documents d
                  LEFT JOIN loans l ON d.loan_id = l.id
                  LEFT JOIN leads ld ON d.lead_id = ld.id
                  WHERE d.id = $1 AND (
                    l.created_by = $2 OR l.assigned_to = $2
                    OR ld.created_by = $2 OR ld.assigned_to = $2
                    OR d.uploaded_by = $2
                  )
                ) as has_access
              `, [documentId, userId]);

              if (!docAccess.rows[0].has_access) {
                return res.status(403).json({
                  error: 'Document access denied',
                  message: 'You do not have permission to access this document',
                  code: 'DOCUMENT_ACCESS_DENIED'
                });
              }
            }
            break;
        }

        next();
      } catch (error) {
        return res.status(500).json({
          error: 'Business rule validation failed',
          message: error.message
        });
      }
    };
  },

  // Validate input data integrity
  validateInputIntegrity: (schema) => {
    return (req, res, next) => {
      try {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
          const value = req.body[field];

          if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
          }

          if (value !== undefined && value !== null) {
            if (rules.type && typeof value !== rules.type) {
              errors.push(`${field} must be of type ${rules.type}`);
            }

            if (rules.minLength && value.length < rules.minLength) {
              errors.push(`${field} must be at least ${rules.minLength} characters`);
            }

            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`${field} must not exceed ${rules.maxLength} characters`);
            }

            if (rules.pattern && !rules.pattern.test(value)) {
              errors.push(`${field} format is invalid`);
            }

            if (rules.enum && !rules.enum.includes(value)) {
              errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
            }
          }
        }

        if (errors.length > 0) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'Input data validation failed',
            details: errors,
            code: 'VALIDATION_FAILED'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          error: 'Input validation failed',
          message: error.message
        });
      }
    };
  },

  // Rate limiting per user and role
  validateRateLimit: (limits = {}) => {
    const userRequests = new Map();
    
    return (req, res, next) => {
      const userId = req.user.id;
      const userRole = req.user.role;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute window
      
      const defaultLimits = {
        admin: 1000,
        sales_manager: 500,
        branch_manager: 300,
        dsa: 200,
        team_leader: 100,
        executive: 50
      };

      const limit = limits[userRole] || defaultLimits[userRole] || 10;
      
      if (!userRequests.has(userId)) {
        userRequests.set(userId, []);
      }

      const requests = userRequests.get(userId);
      
      // Remove old requests outside the window
      const validRequests = requests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= limit) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${limit} per minute`,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      validRequests.push(now);
      userRequests.set(userId, validRequests);
      
      next();
    };
  }
};

export default validateBackendSecurity;