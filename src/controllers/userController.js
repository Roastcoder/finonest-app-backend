import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getHierarchyTree = async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.user_id, u.full_name, u.phone, u.role, u.reporting_to, u.branch_id, u.dsa_id, u.status, u.refer_code,
             b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
    `;
    const params = [];

    if (req.user.role === 'sales_manager') {
      query += ` WHERE u.reporting_to = $1`;
      params.push(req.user.id);
    } else if (req.user.role === 'branch_manager') {
      query += ` WHERE u.reporting_to = $1 OR u.role = 'executive'`;
      params.push(req.user.id);
    } else if (req.user.role === 'dsa') {
      query += ` WHERE u.dsa_id = $1`;
      params.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      query += ` WHERE u.reporting_to = $1`;
      params.push(req.user.id);
    }
    // admin and operation_team see all — no filter

    query += ' ORDER BY role DESC, full_name ASC';
    const result = await db.query(query, params);
    const rows = result.rows.map(u => ({ ...u, role: u.role === 'manager' ? 'sales_manager' : u.role }));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.user_id, u.full_name, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
             b.name as branch_name,
             m.full_name as manager_name,
             d.full_name as dsa_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN users m ON u.reporting_to = m.id
      LEFT JOIN users d ON u.dsa_id = d.id
    `;

    const params = [];

    // Team leaders can only see their team members
    if (req.user.role === 'team_leader') {
      query += ' WHERE u.reporting_to = $1';
      params.push(req.user.id);
    }
    // Branch managers can see their team leaders and executives
    else if (req.user.role === 'branch_manager') {
      query += ` WHERE u.reporting_to = $1`;
      params.push(req.user.id);
    }
    // DSAs can see their team leaders and executives
    else if (req.user.role === 'dsa') {
      query += ` WHERE u.dsa_id = $1`;
      params.push(req.user.id);
    }
    // Sales managers can see their branch managers and DSAs
    else if (req.user.role === 'sales_manager') {
      query += ` WHERE u.reporting_to = $1`;
      params.push(req.user.id);
    }
    // operation_team can see all users
    else if (req.user.role === 'operation_team') {
      // No filter - can see all users
    }


    query += ' ORDER BY u.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
             b.name as branch_name,
             m.full_name as manager_name,
             d.full_name as dsa_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN users m ON u.reporting_to = m.id
      LEFT JOIN users d ON u.dsa_id = d.id
      WHERE u.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { password, mpin, role, full_name, phone, branch_id, reporting_to, dsa_id } = req.body;

    // Validation
    if (!password || !role || !full_name || !phone) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Password, role, full name, and phone are required' });
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    // Validate MPIN if provided
    if (mpin && !/^\d{4}$/.test(mpin)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'MPIN must be exactly 4 digits' });
    }

    // Role-based permissions
    const validRoles = ['admin', 'operation_team', 'sales_manager', 'branch_manager', 'dsa', 'team_leader', 'executive'];
    if (!validRoles.includes(role)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Permission checks based on user role
    if (req.user.role === 'sales_manager') {
      if (!['branch_manager', 'dsa', 'team_leader', 'executive'].includes(role)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Sales managers can only create branch managers, DSAs, team leaders, and executives' });
      }
      // Branch manager must have branch_id
      if (role === 'branch_manager' && !branch_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'branch_id is required for branch managers' });
      }
      // Team leader must have branch_id
      if (role === 'team_leader' && !branch_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'branch_id is required for team leaders' });
      }
    } else if (req.user.role === 'branch_manager') {
      if (!['team_leader', 'executive'].includes(role)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Branch managers can only create team leaders and executives' });
      }
      // Team leaders created by branch manager must have branch_id
      if (role === 'team_leader' && !branch_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'branch_id is required for team leaders' });
      }
    } else if (req.user.role === 'dsa') {
      if (!['team_leader', 'executive'].includes(role)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'DSAs can only create team leaders and executives' });
      }
      // Team leaders created by DSA must have branch_id
      if (role === 'team_leader' && !branch_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'branch_id is required for team leaders' });
      }
    } else if (req.user.role === 'team_leader') {
      if (role !== 'executive') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Team leaders can only create executives' });
      }
    } else if (req.user.role === 'admin' || req.user.role === 'operation_team') {
      if (role === 'team_leader' && !branch_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'branch_id is required for team leaders' });
      }
    } else {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if phone already exists
    const existingUser = await client.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedMpin = mpin ? await bcrypt.hash(mpin, 10) : null;

    // Generate unique user ID with FN prefix
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM 'FN(\\d+)') AS INTEGER)), 0) + 1 as next_seq
       FROM users WHERE user_id LIKE 'FN%'`
    );

    const sequence = String(seqResult.rows[0].next_seq).padStart(5, '0');
    const userId = `FN${sequence}`;

    const userData = {
      user_id: userId,
      name: full_name,
      full_name: full_name,
      phone,
      password: hashedPassword,
      mpin: hashedMpin,
      role,
      branch_id: branch_id || null,
      reporting_to: reporting_to || null,
      dsa_id: dsa_id || null,
      joining_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    const { keys, values, params } = toPostgresParams(userData);
    console.log('Creating user with data:', { keys, values });
    const result = await client.query(
      `INSERT INTO users (${keys.join(', ')}) VALUES (${params}) RETURNING id, user_id`,
      values
    );

    // Generate refer code for eligible roles
    let referCode = null;
    if (['team_leader', 'branch_manager', 'dsa'].includes(role)) {
      // Generate 8 character alphanumeric refer code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      referCode = '';
      for (let i = 0; i < 8; i++) {
        referCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Ensure uniqueness
      let isUnique = false;
      while (!isUnique) {
        const existingCode = await client.query(
          'SELECT id FROM users WHERE refer_code = $1',
          [referCode]
        );
        if (existingCode.rows.length === 0) {
          isUnique = true;
        } else {
          // Generate new code if duplicate found
          referCode = '';
          for (let i = 0; i < 8; i++) {
            referCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        }
      }
      
      // Update user with refer code
      await client.query(
        'UPDATE users SET refer_code = $1 WHERE id = $2',
        [referCode, result.rows[0].id]
      );
    }
    
    // Fetch the created user with branch name
    const createdUser = await client.query(`
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at, u.refer_code,
             b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = $1
    `, [result.rows[0].id]);
    
    res.status(201).json({
      message: 'User created successfully',
      user: createdUser.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateUser = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const { password, role, branch_id, reporting_to, dsa_id, ...userData } = req.body;
    const updates = { ...userData };

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    if (role) updates.role = role;
    if (branch_id !== undefined) updates.branch_id = branch_id;
    if (reporting_to !== undefined) updates.reporting_to = reporting_to;
    if (dsa_id !== undefined) updates.dsa_id = dsa_id;

    const { query, values } = buildUpdateQuery('users', updates, req.params.id);
    const result = await client.query(query, values);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate refer code if role changed to eligible role and user doesn't have one
    if (role && ['team_leader', 'branch_manager', 'dsa'].includes(role)) {
      const userCheck = await client.query(
        'SELECT refer_code FROM users WHERE id = $1',
        [req.params.id]
      );
      
      if (userCheck.rows.length > 0 && !userCheck.rows[0].refer_code) {
        // Generate 8 character alphanumeric refer code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let referCode = '';
        let isUnique = false;
        
        while (!isUnique) {
          referCode = '';
          for (let i = 0; i < 8; i++) {
            referCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          const existingCode = await client.query(
            'SELECT id FROM users WHERE refer_code = $1',
            [referCode]
          );
          
          if (existingCode.rows.length === 0) {
            isUnique = true;
          }
        }
        
        // Update user with refer code
        await client.query(
          'UPDATE users SET refer_code = $1 WHERE id = $2',
          [referCode, req.params.id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const deleteUser = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    // Check if user exists and get their details
    const userResult = await client.query(
      'SELECT id, full_name, pan_number, aadhaar_number FROM users WHERE id = $1',
      [req.params.id]
    );
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];

    // Check if user has any dependencies
    const dependencies = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE reporting_to = $1 OR dsa_id = $1',
      [req.params.id]
    );
    
    if (dependencies.rows[0].count > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete user with team members. Please reassign team members first.' 
      });
    }

    // Delete all user-related data
    console.log(`Deleting user ${user.full_name} (ID: ${user.id}) with all related data...`);
    
    // Delete user record (this will cascade delete related data due to foreign key constraints)
    // But we'll explicitly clear sensitive data first
    await client.query(
      `UPDATE users SET 
        pan_number = NULL,
        aadhaar_number = NULL,
        pan_data = NULL,
        aadhaar_data = NULL,
        pan_verified = false,
        aadhaar_verified = false,
        kyc_completed = false,
        photo_path = NULL,
        date_of_birth = NULL,
        father_name = NULL,
        address_line1 = NULL,
        address_line2 = NULL,
        city = NULL,
        state = NULL,
        pincode = NULL,
        country = NULL
      WHERE id = $1`,
      [req.params.id]
    );
    
    // Now delete the user record completely
    const deleteResult = await client.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    
    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Failed to delete user' });
    }
    
    await client.query('COMMIT');
    
    console.log(`Successfully deleted user ${user.full_name} and all related data including PAN: ${user.pan_number || 'N/A'}, Aadhaar: ${user.aadhaar_number || 'N/A'}`);
    
    res.json({ 
      message: 'User and all related data deleted successfully',
      deletedUser: {
        id: user.id,
        name: user.full_name,
        pan_cleared: !!user.pan_number,
        aadhaar_cleared: !!user.aadhaar_number
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const searchUser = async (req, res) => {
  try {
    const { name } = req.query;
    const result = await db.query(`
      SELECT u.id, u.user_id, u.full_name, u.email, u.role, u.reporting_to, u.dsa_id,
             m.full_name as manager_name, m.role as manager_role,
             d.full_name as dsa_name
      FROM users u
      LEFT JOIN users m ON u.reporting_to = m.id
      LEFT JOIN users d ON u.dsa_id = d.id
      WHERE u.full_name ILIKE $1
    `, [`%${name}%`]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
             b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.reporting_to = $1
      ORDER BY u.created_at DESC
    `, [req.params.leaderId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const { roles } = req.query;
    
    if (!roles) {
      return res.status(400).json({ error: 'roles query parameter is required' });
    }
    
    const roleArray = roles.split(',').map(r => r.trim());
    const placeholders = roleArray.map((_, i) => `$${i + 1}`).join(',');
    
    const result = await db.query(`
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
             b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.role IN (${placeholders}) AND u.status = 'active'
      ORDER BY u.role DESC, u.full_name ASC
    `, roleArray);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getManagerTeamHierarchy = async (req, res) => {
  try {
    let teamLeaders;
    
    // Different queries based on role
    if (req.user.role === 'sales_manager') {
      // sales_manager sees all branch_managers and DSAs reporting to them, with their team leaders
      const directReports = await db.query(`
        SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
               b.name as branch_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.reporting_to = $1
        ORDER BY u.full_name ASC
      `, [req.user.id]);

      if (directReports.rows.length === 0) return res.json([]);

      const hierarchy = await Promise.all(
        directReports.rows.map(async (report) => {
          const teamMembers = await db.query(`
            SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
                   b.name as branch_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.reporting_to = $1
            ORDER BY u.full_name ASC
          `, [report.id]);
          return { ...report, team_members: teamMembers.rows };
        })
      );
      return res.json(hierarchy);
    } else if (req.user.role === 'branch_manager') {
      teamLeaders = await db.query(`
        SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
               b.name as branch_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.reporting_to = $1
        ORDER BY u.full_name ASC
      `, [req.user.id]);
    } else if (req.user.role === 'dsa') {
      teamLeaders = await db.query(`
        SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
               b.name as branch_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.reporting_to = $1
        ORDER BY u.full_name ASC
      `, [req.user.id]);
    } else {
      return res.json([]);
    }

    // If no team leaders, return empty array
    if (teamLeaders.rows.length === 0) {
      return res.json([]);
    }

    const hierarchy = await Promise.all(
      teamLeaders.rows.map(async (leader) => {
        const teamMembers = await db.query(`
          SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
                 b.name as branch_name
          FROM users u
          LEFT JOIN branches b ON u.branch_id = b.id
          WHERE u.reporting_to = $1
          ORDER BY u.full_name ASC
        `, [leader.id]);
        
        return {
          ...leader,
          team_members: teamMembers.rows
        };
      })
    );

    res.json(hierarchy);
  } catch (error) {
    console.error('Get manager team hierarchy error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, full_name, status',
      ['active', req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User approved successfully', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, full_name, status',
      ['rejected', req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User rejected successfully', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExistingUsersStatus = async (req, res) => {
  try {
    // Only admin can run this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update user statuses' });
    }

    const result = await db.query(
      "UPDATE users SET status = 'active' WHERE status IS NULL OR status = '' OR status = 'pending'"
    );
    
    res.json({ 
      message: `Updated ${result.rowCount} users to active status`,
      updatedCount: result.rowCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateReferCodes = async (req, res) => {
  try {
    // Only admin can run this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can generate refer codes' });
    }

    const client = await db.connect();
    try {
      // Get users who need refer codes
      const usersResult = await client.query(`
        SELECT id FROM users 
        WHERE role IN ('team_leader', 'branch_manager', 'dsa') AND refer_code IS NULL
      `);
      
      let updatedCount = 0;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      
      for (const user of usersResult.rows) {
        let referCode = '';
        let isUnique = false;
        
        // Generate unique 8 character code
        while (!isUnique) {
          referCode = '';
          for (let i = 0; i < 8; i++) {
            referCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          const existingCode = await client.query(
            'SELECT id FROM users WHERE refer_code = $1',
            [referCode]
          );
          
          if (existingCode.rows.length === 0) {
            isUnique = true;
          }
        }
        
        // Update user with refer code
        await client.query(
          'UPDATE users SET refer_code = $1 WHERE id = $2',
          [referCode, user.id]
        );
        
        updatedCount++;
      }
      
      res.json({ 
        message: `Generated refer codes for ${updatedCount} users`,
        updatedCount 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getHierarchyTree,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUser,
  getTeamMembers,
  getManagerTeamHierarchy,
  getUsersByRole,
  approveUser,
  rejectUser,
  updateExistingUsersStatus,
  generateReferCodes
};
