import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getHierarchyTree = async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.user_id, u.full_name, u.email, u.role, u.reporting_to, u.branch_id, u.dsa_id,
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
    // admin sees all — no filter

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
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
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

    const { password, role, full_name, email, phone, branch_id, reporting_to, dsa_id } = req.body;

    // Validation
    if (!password || !role || !full_name || !email) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Password, role, full name, and email are required' });
    }

    // Role-based permissions
    const validRoles = ['admin', 'sales_manager', 'branch_manager', 'dsa', 'team_leader', 'executive'];
    if (!validRoles.includes(role)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Permission checks based on user role
    if (req.user.role === 'sales_manager') {
      if (!['branch_manager', 'dsa'].includes(role)) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Sales managers can only create branch managers and DSAs' });
      }
      // Branch manager must have branch_id
      if (role === 'branch_manager' && !branch_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'branch_id is required for branch managers' });
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
    } else if (req.user.role === 'team_leader') {
      if (role !== 'executive') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Team leaders can only create executives' });
      }
    } else if (req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if email already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique user ID
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM users`
    );

    const sequence = String(seqResult.rows[0].next_seq).padStart(4, '0');
    const initials = (full_name || 'XX').substring(0, 2).toUpperCase();
    const userId = `${initials}-${sequence}`;

    const userData = {
      user_id: userId,
      full_name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role,
      branch_id: branch_id || null,
      reporting_to: reporting_to || null,
      dsa_id: dsa_id || null,
      joining_date: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    const { keys, values, params } = toPostgresParams(userData);
    const result = await client.query(
      `INSERT INTO users (${keys.join(', ')}) VALUES (${params}) RETURNING id, user_id`,
      values
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'User created successfully',
      userId: result.rows[0].id,
      user_id: result.rows[0].user_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email or user ID already exists' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateUser = async (req, res) => {
  try {
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
    const result = await db.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Check if user has any dependencies
    const dependencies = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE reporting_to = $1 OR dsa_id = $1',
      [req.params.id]
    );
    
    if (dependencies.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with team members. Please reassign team members first.' 
      });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
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
        directReports.rows.map(async (report: any) => {
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
        WHERE u.reporting_to = $1 AND u.role = 'team_leader'
        ORDER BY u.full_name ASC
      `, [req.user.id]);
    } else if (req.user.role === 'dsa') {
      teamLeaders = await db.query(`
        SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.dsa_id, u.joining_date, u.created_at,
               b.name as branch_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE (u.dsa_id = $1 OR u.reporting_to = $1) AND u.role = 'team_leader'
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
  getUsersByRole
};
