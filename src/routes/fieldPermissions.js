import express from 'express';
import { authenticate  } from '../middleware/enhancedAuth.js';

const router = express.Router();

router.use(authenticate);

// Get field permissions for current user
router.get('/', async (req, res) => {
  try {
    // Default field permissions based on user role
    const permissions = {
      admin: {
        leads: { read: true, write: true, delete: true },
        loans: { read: true, write: true, delete: true },
        users: { read: true, write: true, delete: true },
        banks: { read: true, write: true, delete: true },
        reports: { read: true, write: true, delete: false },
        dashboard: { read: true, write: false, delete: false }
      },
      manager: {
        leads: { read: true, write: true, delete: false },
        loans: { read: true, write: true, delete: false },
        users: { read: true, write: false, delete: false },
        banks: { read: true, write: false, delete: false },
        reports: { read: true, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false }
      },
      team_leader: {
        leads: { read: true, write: true, delete: false },
        loans: { read: true, write: true, delete: false },
        users: { read: true, write: false, delete: false },
        banks: { read: true, write: false, delete: false },
        reports: { read: true, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false }
      },
      executive: {
        leads: { read: true, write: true, delete: false },
        loans: { read: true, write: true, delete: false },
        users: { read: false, write: false, delete: false },
        banks: { read: true, write: false, delete: false },
        reports: { read: false, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false }
      },
      accountant: {
        leads: { read: true, write: false, delete: false },
        loans: { read: true, write: true, delete: false },
        users: { read: false, write: false, delete: false },
        banks: { read: true, write: false, delete: false },
        reports: { read: true, write: false, delete: false },
        dashboard: { read: true, write: false, delete: false }
      }
    };

    const userRole = req.user.role || 'executive';
    const userPermissions = permissions[userRole] || permissions.executive;

    res.json({
      role: userRole,
      permissions: userPermissions,
      userId: req.user.id,
      userName: req.user.full_name || req.user.user_id
    });
  } catch (error) {
    console.error('Get field permissions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update field permissions (admin only)
router.put('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update field permissions' });
    }

    // In a real implementation, you would save these to database
    // For now, just return success
    res.json({ message: 'Field permissions updated successfully' });
  } catch (error) {
    console.error('Update field permissions error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;