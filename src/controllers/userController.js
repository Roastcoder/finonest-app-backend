import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { buildUpdateQuery, toPostgresParams } from '../utils/postgres.js';

export const getHierarchyTree = async (req, res) => {
  try {
    const query = `
      WITH RECURSIVE user_tree AS (
        SELECT id, user_id, full_name, email, role, reporting_to, branch_id
        FROM users
        WHERE reporting_to IS NULL

        UNION ALL

        SELECT u.id, u.user_id, u.full_name, u.email, u.role, u.reporting_to, u.branch_id
        FROM users u
        INNER JOIN user_tree t ON u.reporting_to = t.id
      )
      SELECT * FROM user_tree;
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.joining_date, u.created_at,
             b.name as branch_name,
             m.full_name as manager_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN users m ON u.reporting_to = m.id
    `;

    const params = [];

    // Team leaders can only see their team members
    if (req.user.role === 'team_leader') {
      query += ' WHERE u.reporting_to = $1';
      params.push(req.user.id);
    }
    // Managers can see their team leaders and all executives under those team leaders
    else if (req.user.role === 'manager') {
      query += ` WHERE u.id IN (
        WITH RECURSIVE team_hierarchy AS (
          SELECT id FROM users WHERE reporting_to = $1
          UNION ALL
          SELECT u.id FROM users u
          INNER JOIN team_hierarchy t ON u.reporting_to = t.id
        )
        SELECT id FROM team_hierarchy
      )`;
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
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.joining_date, u.created_at,
             b.name as branch_name,
             m.full_name as manager_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN users m ON u.reporting_to = m.id
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

    const { password, role, full_name, email, phone, branch_id, reporting_to } = req.body;

    // Validation
    if (!password || !role || !full_name || !email) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Password, role, full name, and email are required' });
    }

    // Role-based permissions
    if (req.user.role === 'manager' && !['team_leader', 'executive'].includes(role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Managers can only create team leaders and executives' });
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
      name: full_name, // Add name field
      full_name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role,
      branch_id: branch_id || null,
      reporting_to: reporting_to || null,
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
    const { password, role, branch_id, reporting_to, ...userData } = req.body;
    const updates = { ...userData };

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    if (role) updates.role = role;
    if (branch_id !== undefined) updates.branch_id = branch_id;
    if (reporting_to !== undefined) updates.reporting_to = reporting_to;

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
      'SELECT COUNT(*) as count FROM users WHERE reporting_to = $1',
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
      SELECT u.id, u.user_id, u.full_name, u.email, u.role, u.reporting_to,
             m.full_name as manager_name, m.role as manager_role
      FROM users u
      LEFT JOIN users m ON u.reporting_to = m.id
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
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.joining_date, u.created_at,
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

export const getManagerTeamHierarchy = async (req, res) => {
  try {
    const teamLeaders = await db.query(`
      SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.joining_date, u.created_at,
             b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.reporting_to = $1 AND u.role = 'team_leader'
      ORDER BY u.full_name ASC
    `, [req.user.id]);

    const hierarchy = await Promise.all(
      teamLeaders.rows.map(async (leader) => {
        const teamMembers = await db.query(`
          SELECT u.id, u.user_id, u.full_name, u.email, u.phone, u.role, u.branch_id, u.reporting_to, u.joining_date, u.created_at,
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
}
