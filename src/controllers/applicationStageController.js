import db from '../config/database.js';

// Application stage definitions
export const APPLICATION_STAGES = {
  SUBMITTED: 'submitted',
  LOGIN: 'login',
  IN_PROCESS: 'in_process',
  REJECTED: 'rejected',
  APPROVED: 'approved',
  DISBURSED: 'disbursed',
  CANCELLED: 'cancelled'
};

// Stage validation rules
const STAGE_TRANSITIONS = {
  [APPLICATION_STAGES.SUBMITTED]: [APPLICATION_STAGES.LOGIN, APPLICATION_STAGES.REJECTED],
  [APPLICATION_STAGES.LOGIN]: [APPLICATION_STAGES.IN_PROCESS, APPLICATION_STAGES.REJECTED],
  [APPLICATION_STAGES.IN_PROCESS]: [APPLICATION_STAGES.APPROVED, APPLICATION_STAGES.REJECTED],
  [APPLICATION_STAGES.REJECTED]: [], // Terminal state
  [APPLICATION_STAGES.APPROVED]: [APPLICATION_STAGES.DISBURSED, APPLICATION_STAGES.CANCELLED],
  [APPLICATION_STAGES.DISBURSED]: [], // Terminal state
  [APPLICATION_STAGES.CANCELLED]: [] // Terminal state
};

// Get all loans with their application stages
export const getLoansWithStages = async (req, res) => {
  try {
    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             b.name as bank_name,
             br.name as broker_name,
             l.application_stage,
             l.app_score,
             l.credit_score,
             l.tags,
             l.roi,
             l.loan_account_number,
             l.rc_type,
             l.rc_collected_by,
             l.rto_agent_name_rc,
             l.rto_agent_mobile,
             l.banker_name,
             l.banker_mobile,
             l.stage_changed_at
      FROM loans l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN banks b ON COALESCE(l.assigned_bank_id, l.bank_id) = b.id
      LEFT JOIN brokers br ON COALESCE(l.assigned_broker_id, l.broker_id) = br.id
    `;
    
    const conditions = [];
    const values = [];
    
    // Role-based filtering
    if (req.user.role === 'executive' || req.user.role === 'team_leader') {
      conditions.push('l.created_by = $1');
      values.push(req.user.id);
    }
    
    // Stage filtering
    if (req.query.stage) {
      conditions.push(`l.application_stage = $${values.length + 1}`);
      values.push(req.query.stage);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.stage_changed_at DESC, l.created_at DESC';
    
    const result = await db.query(query, values);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get loans with stages error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Update application stage (Admin/Manager only)
export const updateApplicationStage = async (req, res) => {
  const client = await db.connect();
  try {
    // Check if user has permission to change stages
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admin and manager can change application stages' });
    }

    await client.query('BEGIN');
    
    const { loanId } = req.params;
    const { 
      stage, 
      app_score, 
      credit_score, 
      tags, 
      rejection_remarks,
      approval_remarks,
      loan_amount,
      roi,
      tenure,
      loan_account_number,
      rc_type,
      rc_collected_by,
      rto_agent_name_rc,
      rto_agent_mobile,
      banker_name,
      banker_mobile,
      cancellation_remarks
    } = req.body;

    // Get current loan data
    const currentLoan = await client.query(
      'SELECT application_stage FROM loans WHERE id = $1',
      [loanId]
    );

    if (currentLoan.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Loan not found' });
    }

    const currentStage = currentLoan.rows[0].application_stage || APPLICATION_STAGES.SUBMITTED;

    // Validate stage transition
    if (stage && !STAGE_TRANSITIONS[currentStage].includes(stage) && currentStage !== stage) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Invalid stage transition from ${currentStage} to ${stage}` 
      });
    }

    // Build update data based on stage
    const updateData = {
      stage_changed_at: new Date()
    };

    if (stage) updateData.application_stage = stage;
    if (app_score !== undefined) updateData.app_score = app_score;
    if (credit_score !== undefined) updateData.credit_score = credit_score;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [tags];
    if (roi !== undefined) updateData.roi = roi;
    if (loan_account_number !== undefined) updateData.loan_account_number = loan_account_number;
    if (rc_type !== undefined) updateData.rc_type = rc_type;
    if (rc_collected_by !== undefined) updateData.rc_collected_by = rc_collected_by;
    if (rto_agent_name_rc !== undefined) updateData.rto_agent_name_rc = rto_agent_name_rc;
    if (rto_agent_mobile !== undefined) updateData.rto_agent_mobile = rto_agent_mobile;
    if (banker_name !== undefined) updateData.banker_name = banker_name;
    if (banker_mobile !== undefined) updateData.banker_mobile = banker_mobile;

    // Stage-specific fields
    if (stage === APPLICATION_STAGES.REJECTED && rejection_remarks) {
      updateData.rejection_remarks = rejection_remarks;
    }
    
    if (stage === APPLICATION_STAGES.APPROVED) {
      if (approval_remarks) updateData.approval_remarks = approval_remarks;
      if (loan_amount) updateData.loan_amount = loan_amount;
      if (tenure) updateData.tenure = tenure;
      updateData.approved_at = new Date();
    }
    
    if (stage === APPLICATION_STAGES.DISBURSED) {
      if (loan_amount) updateData.loan_amount = loan_amount;
      if (tenure) updateData.tenure = tenure;
      updateData.disbursement_date = new Date();
    }
    
    if (stage === APPLICATION_STAGES.CANCELLED && cancellation_remarks) {
      updateData.cancellation_remarks = cancellation_remarks;
    }

    // Update loan
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [loanId, ...Object.values(updateData)];
    
    await client.query(
      `UPDATE loans SET ${setClause} WHERE id = $1`,
      values
    );

    // Record stage history
    if (stage && stage !== currentStage) {
      await client.query(
        `INSERT INTO application_stage_history (loan_id, from_stage, to_stage, changed_by, remarks) 
         VALUES ($1, $2, $3, $4, $5)`,
        [loanId, currentStage, stage, req.user.id, req.body.remarks || null]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Application stage updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update application stage error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Get stage history for a loan
export const getStageHistory = async (req, res) => {
  try {
    const { loanId } = req.params;
    
    const result = await db.query(`
      SELECT ash.*, u.full_name as changed_by_name
      FROM application_stage_history ash
      LEFT JOIN users u ON ash.changed_by = u.id
      WHERE ash.loan_id = $1
      ORDER BY ash.created_at DESC
    `, [loanId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get stage history error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get stage statistics
export const getStageStatistics = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        application_stage,
        COUNT(*) as count,
        AVG(CASE WHEN application_stage = 'approved' THEN loan_amount END) as avg_approved_amount,
        SUM(CASE WHEN application_stage = 'disbursed' THEN loan_amount ELSE 0 END) as total_disbursed
      FROM loans
      WHERE application_stage IS NOT NULL
      GROUP BY application_stage
      ORDER BY 
        CASE application_stage
          WHEN 'submitted' THEN 1
          WHEN 'login' THEN 2
          WHEN 'in_process' THEN 3
          WHEN 'approved' THEN 4
          WHEN 'disbursed' THEN 5
          WHEN 'rejected' THEN 6
          WHEN 'cancelled' THEN 7
          ELSE 8
        END
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get stage statistics error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Auto-cancel approved loans after 30 days
export const autoCancelExpiredLoans = async () => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE loans 
      SET application_stage = $1, 
          cancellation_remarks = 'Auto-cancelled: Not disbursed within 30 days',
          stage_changed_at = CURRENT_TIMESTAMP
      WHERE application_stage = $2 
        AND approved_at < CURRENT_DATE - INTERVAL '30 days'
      RETURNING id, loan_number
    `, [APPLICATION_STAGES.CANCELLED, APPLICATION_STAGES.APPROVED]);
    
    // Record stage history for auto-cancelled loans
    for (const loan of result.rows) {
      await client.query(
        `INSERT INTO application_stage_history (loan_id, from_stage, to_stage, changed_by, remarks) 
         VALUES ($1, $2, $3, $4, $5)`,
        [loan.id, APPLICATION_STAGES.APPROVED, APPLICATION_STAGES.CANCELLED, 1, 'Auto-cancelled after 30 days']
      );
    }
    
    await client.query('COMMIT');
    console.log(`Auto-cancelled ${result.rowCount} expired loans`);
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Auto-cancel expired loans error:', error.message);
    throw error;
  } finally {
    client.release();
  }
};