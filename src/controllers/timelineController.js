import db from '../config/database.js';

export const getLeadTimeline = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    const result = await db.query(`
      SELECT lsh.*, 
             COALESCE(u.full_name, u.user_id) as changed_by_name,
             u.role as changed_by_role
      FROM lead_stage_history lsh
      LEFT JOIN users u ON lsh.changed_by = u.id
      WHERE lsh.lead_id = $1
      ORDER BY lsh.created_at ASC
    `, [leadId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get lead timeline error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const addTimelineEntry = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { from_stage, to_stage, remarks } = req.body;
    
    if (!to_stage) {
      return res.status(400).json({ error: 'To stage is required' });
    }

    // Verify lead exists
    const leadCheck = await db.query('SELECT id, stage FROM leads WHERE id = $1', [leadId]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const currentStage = leadCheck.rows[0].stage;
    
    const result = await db.query(`
      INSERT INTO lead_stage_history (lead_id, from_stage, to_stage, changed_by, remarks)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [leadId, from_stage || currentStage, to_stage, req.user.id, remarks || null]);

    // Update the lead's current stage
    await db.query('UPDATE leads SET stage = $1 WHERE id = $2', [to_stage, leadId]);

    res.status(201).json({
      message: 'Timeline entry added successfully',
      entryId: result.rows[0].id,
      timestamp: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Add timeline entry error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getLoanTimeline = async (req, res) => {
  try {
    const { loanId } = req.params;
    
    // Get loan stage changes from audit logs or create a simple timeline
    const result = await db.query(`
      SELECT 
        'loan_created' as event_type,
        created_at as timestamp,
        'Loan application created' as description,
        COALESCE(u.full_name, u.user_id) as user_name
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE l.id = $1
      
      UNION ALL
      
      SELECT 
        'status_change' as event_type,
        updated_at as timestamp,
        CONCAT('Status changed to ', status) as description,
        'System' as user_name
      FROM loans
      WHERE id = $1 AND updated_at != created_at
      
      ORDER BY timestamp ASC
    `, [loanId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get loan timeline error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { table_name, record_id } = req.query;
    let query = `
      SELECT al.*, 
             COALESCE(u.full_name, u.user_id) as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    
    const conditions = [];
    const values = [];
    
    if (table_name) {
      conditions.push('al.table_name = $' + (values.length + 1));
      values.push(table_name);
    }
    
    if (record_id) {
      conditions.push('al.record_id = $' + (values.length + 1));
      values.push(record_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT 100';
    
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createAuditLog = async (req, res) => {
  try {
    const { action, table_name, record_id, before_value, after_value } = req.body;
    
    if (!action || !table_name) {
      return res.status(400).json({ error: 'Action and table name are required' });
    }

    const result = await db.query(`
      INSERT INTO audit_logs (user_id, user_role, action, table_name, record_id, before_value, after_value, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `, [
      req.user.id,
      req.user.role,
      action,
      table_name,
      record_id || null,
      before_value || null,
      after_value || null,
      req.ip || null,
      req.get('User-Agent') || null
    ]);

    res.status(201).json({
      message: 'Audit log created successfully',
      logId: result.rows[0].id,
      timestamp: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSystemActivity = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await db.query(`
      SELECT al.*, 
             COALESCE(u.full_name, u.user_id) as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await db.query('SELECT COUNT(*) as total FROM audit_logs');
    
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get system activity error:', error);
    res.status(500).json({ error: error.message });
  }
};