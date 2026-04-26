import db from '../config/database.js';

// Get user permissions
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin has all permissions
    if (userRole === 'admin') {
      return res.json({
        role: userRole,
        permissions: {
          dashboard: {
            view: true,
            export: true,
            components: {
              loginVolume: true,
              disbursement: true,
              approvedLoans: true,
              performanceChart: true,
              stageDistribution: true,
              bankDistribution: true,
              statusDistribution: true,
              timer: true
            }
          },
          loans: {
            create: true,
            read: true,
            update: true,
            delete: true,
            updateStage: true,
            viewAll: true
          },
          leads: {
            create: true,
            read: true,
            update: true,
            delete: true,
            assign: true,
            viewAll: true
          },
          users: {
            create: true,
            read: true,
            update: true,
            delete: true,
            viewAll: true
          },
          reports: {
            view: true,
            export: true,
            viewAll: true
          }
        }
      });
    }

    // Get role-based permissions
    const rolePermissionsQuery = `
      SELECT 
        p.permission_name,
        p.resource,
        p.action,
        rp.granted
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = $1 AND rp.granted = true
    `;

    // Get user-specific permissions
    const userPermissionsQuery = `
      SELECT 
        p.permission_name,
        p.resource,
        p.action,
        up.granted
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
    `;

    const [rolePerms, userPerms] = await Promise.all([
      db.query(rolePermissionsQuery, [userRole]),
      db.query(userPermissionsQuery, [userId])
    ]);

    // Combine and structure permissions
    const permissions = {
      dashboard: {
        view: false,
        export: false,
        components: {
          loginVolume: false,
          disbursement: false,
          approvedLoans: false,
          performanceChart: false,
          stageDistribution: false,
          bankDistribution: false,
          statusDistribution: false,
          timer: false
        }
      },
      loans: {
        create: false,
        read: false,
        update: false,
        delete: false,
        updateStage: false,
        viewAll: false
      },
      leads: {
        create: false,
        read: false,
        update: false,
        delete: false,
        assign: false,
        viewAll: false
      },
      users: {
        create: false,
        read: false,
        update: false,
        delete: false,
        viewAll: false
      },
      reports: {
        view: false,
        export: false,
        viewAll: false
      }
    };

    // Apply role permissions
    rolePerms.rows.forEach(perm => {
      const [resource, action] = perm.permission_name.split('.');
      if (permissions[resource] && permissions[resource][action] !== undefined) {
        permissions[resource][action] = perm.granted;
      }
    });

    // Override with user-specific permissions
    userPerms.rows.forEach(perm => {
      const [resource, action] = perm.permission_name.split('.');
      if (permissions[resource] && permissions[resource][action] !== undefined) {
        permissions[resource][action] = perm.granted;
      }
    });

    // Apply default role-based permissions if no specific permissions found
    if (rolePerms.rows.length === 0 && userPerms.rows.length === 0) {
      switch (userRole) {
        case 'sales_manager':
          permissions.dashboard.view = true;
          permissions.dashboard.components.loginVolume = true;
          permissions.dashboard.components.approvedLoans = true;
          permissions.dashboard.components.performanceChart = true;
          permissions.loans.read = true;
          permissions.loans.create = true;
          permissions.loans.update = true;
          permissions.loans.updateStage = true;
          permissions.leads.read = true;
          permissions.leads.create = true;
          permissions.leads.update = true;
          break;

        case 'branch_manager':
          permissions.dashboard.view = true;
          permissions.dashboard.components.loginVolume = true;
          permissions.dashboard.components.disbursement = true;
          permissions.dashboard.components.approvedLoans = true;
          permissions.dashboard.components.stageDistribution = true;
          permissions.loans.read = true;
          permissions.loans.create = true;
          permissions.loans.update = true;
          permissions.loans.updateStage = true;
          break;

        case 'executive':
          permissions.dashboard.view = true;
          permissions.dashboard.components.disbursement = true;
          permissions.dashboard.components.approvedLoans = true;
          permissions.dashboard.components.statusDistribution = true;
          permissions.dashboard.components.bankDistribution = true;
          permissions.loans.read = true;
          permissions.loans.create = true;
          permissions.loans.update = true;
          permissions.leads.read = true;
          permissions.leads.create = true;
          permissions.leads.update = true;
          break;

        case 'team_leader':
          permissions.dashboard.view = true;
          permissions.dashboard.components.loginVolume = true;
          permissions.dashboard.components.approvedLoans = true;
          permissions.dashboard.components.performanceChart = true;
          permissions.loans.read = true;
          permissions.loans.create = true;
          permissions.loans.update = true;
          break;

        case 'dsa':
          permissions.dashboard.view = true;
          permissions.dashboard.components.approvedLoans = true;
          permissions.dashboard.components.performanceChart = true;
          permissions.loans.read = true;
          permissions.loans.create = true;
          break;

        default:
          // Minimal permissions for other roles
          permissions.dashboard.view = true;
          permissions.loans.read = true;
      }
    }

    res.json({
      role: userRole,
      permissions
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check specific permission
export const checkPermission = async (req, res) => {
  try {
    const { permission } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin has all permissions
    if (userRole === 'admin') {
      return res.json({ hasPermission: true });
    }

    // Check permission in database
    const permissionQuery = `
      SELECT EXISTS(
        SELECT 1 FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = $1 AND p.permission_name = $2 AND rp.granted = true
        UNION
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = $3 AND p.permission_name = $2 AND up.granted = true
      ) as has_permission
    `;

    const result = await db.query(permissionQuery, [userRole, permission, userId]);
    const hasPermission = result.rows[0].has_permission;

    res.json({ hasPermission });

  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard permissions specifically
export const getDashboardPermissions = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Define role-based dashboard permissions
    const rolePermissions = {
      admin: {
        view: true,
        export: true,
        components: {
          loginVolume: true,
          disbursement: true,
          approvedLoans: true,
          performanceChart: true,
          stageDistribution: true,
          bankDistribution: true,
          statusDistribution: true,
          timer: true
        }
      },
      sales_manager: {
        view: true,
        export: false,
        components: {
          loginVolume: true,
          disbursement: false,
          approvedLoans: true,
          performanceChart: true,
          stageDistribution: false,
          bankDistribution: false,
          statusDistribution: false,
          timer: true
        }
      },
      branch_manager: {
        view: true,
        export: false,
        components: {
          loginVolume: true,
          disbursement: true,
          approvedLoans: true,
          performanceChart: false,
          stageDistribution: true,
          bankDistribution: false,
          statusDistribution: false,
          timer: true
        }
      },
      dsa: {
        view: true,
        export: false,
        components: {
          loginVolume: false,
          disbursement: false,
          approvedLoans: true,
          performanceChart: true,
          stageDistribution: false,
          bankDistribution: false,
          statusDistribution: false,
          timer: false
        }
      },
      team_leader: {
        view: true,
        export: false,
        components: {
          loginVolume: true,
          disbursement: false,
          approvedLoans: true,
          performanceChart: true,
          stageDistribution: false,
          bankDistribution: false,
          statusDistribution: false,
          timer: true
        }
      },
      executive: {
        view: true,
        export: false,
        components: {
          loginVolume: false,
          disbursement: true,
          approvedLoans: true,
          performanceChart: false,
          stageDistribution: false,
          bankDistribution: true,
          statusDistribution: true,
          timer: false
        }
      }
    };

    const permissions = rolePermissions[userRole] || {
      view: false,
      export: false,
      components: {}
    };

    res.json({ [userRole]: { dashboard: permissions } });

  } catch (error) {
    console.error('Get dashboard permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update user permissions (admin only)
export const updateUserPermissions = async (req, res) => {
  try {
    const { userId, permissions } = req.body;

    // Only admin can update permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Only administrators can update user permissions' 
      });
    }

    // Start transaction
    const client = await db.connect();
    await client.query('BEGIN');

    try {
      // Clear existing user permissions
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

      // Insert new permissions
      for (const [resource, actions] of Object.entries(permissions)) {
        for (const [action, granted] of Object.entries(actions)) {
          if (typeof granted === 'boolean') {
            const permissionName = `${resource}.${action}`;
            
            // Get or create permission
            let permResult = await client.query(
              'SELECT id FROM permissions WHERE permission_name = $1',
              [permissionName]
            );

            if (permResult.rows.length === 0) {
              permResult = await client.query(
                'INSERT INTO permissions (permission_name, resource, action) VALUES ($1, $2, $3) RETURNING id',
                [permissionName, resource, action]
              );
            }

            const permissionId = permResult.rows[0].id;

            // Insert user permission
            await client.query(
              'INSERT INTO user_permissions (user_id, permission_id, granted) VALUES ($1, $2, $3)',
              [userId, permissionId, granted]
            );
          }
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'User permissions updated successfully' });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};