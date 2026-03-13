import db from '../config/database.js';
import { buildUpdateQuery } from '../utils/postgres.js';
import applicationStageLogic from '../utils/enhancedApplicationStageLogic.js';

export const getAllLoans = async (req, res) => {
  try {
    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             b.name as bank_name,
             br.name as broker_name,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             CASE 
               WHEN l.application_stage = 'SUBMITTED' THEN 'Submitted'
               WHEN l.application_stage = 'LOGIN' THEN 'Login'
               WHEN l.application_stage = 'IN_PROCESS' THEN 'In Process'
               WHEN l.application_stage = 'APPROVED' THEN 'Approved'
               WHEN l.application_stage = 'REJECTED' THEN 'Rejected'
               WHEN l.application_stage = 'DISBURSED' THEN 'Disbursed'
               WHEN l.application_stage = 'CANCELLED' THEN 'Cancelled'
               ELSE 'Submitted'
             END as application_stage_label,
             CASE 
               WHEN l.application_stage = 'SUBMITTED' THEN '#6B7280'
               WHEN l.application_stage = 'LOGIN' THEN '#3B82F6'
               WHEN l.application_stage = 'IN_PROCESS' THEN '#F59E0B'
               WHEN l.application_stage = 'APPROVED' THEN '#10B981'
               WHEN l.application_stage = 'REJECTED' THEN '#EF4444'
               WHEN l.application_stage = 'DISBURSED' THEN '#059669'
               WHEN l.application_stage = 'CANCELLED' THEN '#6B7280'
               ELSE '#6B7280'
             END as application_stage_color,
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
             l.stage_changed_at,
             l.stage_data,
             l.stage_history
      FROM loans l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN banks b ON COALESCE(l.assigned_bank_id, l.bank_id) = b.id
      LEFT JOIN brokers br ON COALESCE(l.assigned_broker_id, l.broker_id) = br.id
    `;
    
    const conditions = [];
    const values = [];
    
    if (req.user.role === 'executive') {
      // Executive sirf apni loans dekhega
      conditions.push('l.created_by = $1');
      values.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      // Team leader sirf apni loans dekhega
      conditions.push('l.created_by = $1');
      values.push(req.user.id);
    }
    // Admin/others ke liye koi filter nahi
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await db.query(query, values);
    
    // Process results to ensure proper stage information
    const processedRows = result.rows.map(row => ({
      ...row,
      application_stage: row.application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      application_stage_label: row.application_stage_label || 'Submitted',
      application_stage_color: row.application_stage_color || applicationStageLogic.STAGE_COLORS.SUBMITTED
    }));
    
    return res.json(processedRows);
  } catch (error) {
    console.error('Get loans error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    console.log('Fetching loan with ID:', req.params.id);
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?.id);
    
    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             b.name as bank_name,
             br.name as broker_name,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             CASE 
               WHEN l.application_stage = 'SUBMITTED' THEN 'Submitted'
               WHEN l.application_stage = 'LOGIN' THEN 'Login'
               WHEN l.application_stage = 'IN_PROCESS' THEN 'In Process'
               WHEN l.application_stage = 'APPROVED' THEN 'Approved'
               WHEN l.application_stage = 'REJECTED' THEN 'Rejected'
               WHEN l.application_stage = 'DISBURSED' THEN 'Disbursed'
               WHEN l.application_stage = 'CANCELLED' THEN 'Cancelled'
               ELSE 'Submitted'
             END as application_stage_label,
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
             l.stage_changed_at,
             l.stage_data,
             l.stage_history
      FROM loans l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN banks b ON COALESCE(l.assigned_bank_id, l.bank_id) = b.id
      LEFT JOIN brokers br ON COALESCE(l.assigned_broker_id, l.broker_id) = br.id
      WHERE l.id = $1
    `;
    
    const values = [req.params.id];
    
    // Apply role-based filtering for loan detail view
    if (req.user.role === 'executive') {
      query += ' AND l.created_by = $2';
      values.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      query += ' AND l.created_by = $2';
      values.push(req.user.id);
    }
    
    console.log('Executing query:', query);
    console.log('With values:', values);
    
    const result = await db.query(query, values);
    
    console.log('Query result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('Loan not found or access denied for ID:', req.params.id);
      return res.status(404).json({ error: 'Loan not found or access denied' });
    }
    
    console.log('Returning loan data for ID:', req.params.id);
    
    // Process result to ensure proper stage information
    const processedLoan = {
      ...result.rows[0],
      application_stage: result.rows[0].application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      application_stage_label: result.rows[0].application_stage_label || 'Submitted'
    };
    
    res.json(processedLoan);
  } catch (error) {
    console.error('Get loan by ID error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

export const createLoan = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    console.log('=== LOAN CREATION REQUEST ===');
    console.log('Request body lead_id:', req.body.lead_id);
    console.log('Request body customer_id:', req.body.customer_id);
    console.log('User:', req.user.id);
    console.log('============================');
    
    // Get user details
    const userResult = await client.query(
      'SELECT id, full_name FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    const initials = (user.full_name || 'XX').substring(0, 2).toUpperCase();
    const userId = String(user.id).padStart(4, '0');
    
    // Get next sequence for this user
    const seqResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(loan_number FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM loans 
       WHERE created_by = $1`,
      [req.user.id]
    );
    
    const sequence = String(seqResult.rows[0].next_seq).padStart(4, '0');
    const loanId = req.body.loan_number || `${initials}-${userId}-${sequence}`;
    
    // Get existing columns from loans table
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans'
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    console.log('Available columns:', existingColumns.length);
    
    // Create comprehensive loan data object with all frontend fields
    const loanData = {
      lead_id: req.body.lead_id || null,
      loan_number: loanId,
      customer_id: req.body.customer_id || null,
      applicant_name: req.body.applicant_name || null,
      customer_name: req.body.applicant_name || req.body.customer_name || null,
      mobile: req.body.mobile || null,
      phone: req.body.mobile || req.body.phone || null,
      email: req.body.email || null,
      co_applicant_name: req.body.co_applicant_name || null,
      co_applicant_mobile: req.body.co_applicant_mobile || null,
      guarantor_name: req.body.guarantor_name || null,
      guarantor_mobile: req.body.guarantor_mobile || null,
      current_address: req.body.current_address || null,
      current_village: req.body.current_village || null,
      current_tehsil: req.body.current_tehsil || null,
      current_district: req.body.current_district || null,
      current_state: req.body.current_state || null,
      current_pincode: req.body.current_pincode || null,
      permanent_address: req.body.permanent_address || null,
      permanent_village: req.body.permanent_village || null,
      permanent_tehsil: req.body.permanent_tehsil || null,
      permanent_district: req.body.permanent_district || null,
      permanent_state: req.body.permanent_state || null,
      permanent_pincode: req.body.permanent_pincode || null,
      our_branch: req.body.our_branch || null,
      income_source: req.body.income_source || null,
      monthly_income: req.body.monthly_income || null,
      selected_financier: req.body.selected_financier || null,
      financier_location: req.body.financier_location || null,
      loan_amount: req.body.loan_amount || 0,
      application_stage: applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      ltv: req.body.ltv || null,
      loan_type_vehicle: req.body.loan_type_vehicle || null,
      vehicle_number: req.body.vehicle_number || null,
      engine_number: req.body.engine_number || null,
      chassis_number: req.body.chassis_number || null,
      owner_name: req.body.owner_name || null,
      maker_name: req.body.maker_name || null,
      maker_description: req.body.maker_description || null,
      maker_model: req.body.maker_model || null,
      model_variant_name: req.body.model_variant_name || null,
      fuel_type: req.body.fuel_type || null,
      manufacturing_date: req.body.manufacturing_date || null,
      ownership_type: req.body.ownership_type || null,
      financer: req.body.financer || null,
      finance_status: req.body.finance_status || null,
      insurance_company: req.body.insurance_company || null,
      insurance_valid_upto: req.body.insurance_valid_upto || null,
      pucc_valid_upto: req.body.pucc_valid_upto || null,
      vertical: req.body.vertical || null,
      scheme: req.body.scheme || null,
      emi_amount: req.body.emi_amount || req.body.emi || null,
      emi: req.body.emi || req.body.emi_amount || null,
      total_emi: req.body.total_emi || null,
      total_interest: req.body.total_interest || null,
      irr: req.body.irr || null,
      interest_rate: req.body.irr || req.body.interest_rate || null,
      tenure: req.body.tenure || null,
      emi_start_date: req.body.emi_start_date || null,
      emi_end_date: req.body.emi_end_date || null,
      processing_fee: req.body.processing_fee || null,
      assigned_bank_id: req.body.assigned_bank_id || null,
      bank_id: req.body.assigned_bank_id || req.body.bank_id || null,
      assigned_broker_id: req.body.assigned_broker_id || null,
      broker_id: req.body.assigned_broker_id || req.body.broker_id || null,
      financier_name: req.body.financier_name || null,
      sanction_amount: req.body.sanction_amount || null,
      sanction_date: req.body.sanction_date || null,
      insurance_company_name: req.body.insurance_company_name || null,
      premium_amount: req.body.premium_amount || null,
      insurance_date: req.body.insurance_date || null,
      insurance_policy_number: req.body.insurance_policy_number || null,
      total_deduction: req.body.total_deduction || null,
      net_disbursement_amount: req.body.net_disbursement_amount || null,
      payment_received_date: req.body.payment_received_date || null,
      rc_owner_name: req.body.rc_owner_name || null,
      rto_agent_name: req.body.rto_agent_name || null,
      agent_mobile_no: req.body.agent_mobile_no || null,
      login_date: req.body.login_date || null,
      approval_date: req.body.approval_date || null,
      sourcing_person_name: req.body.sourcing_person_name || null,
      remark: req.body.remark || null,
      status: req.body.status || 'pending',
      application_stage: req.body.application_stage || applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      disbursement_date: req.body.disbursement_date || null,
      pdd: req.body.pdd || null,
      assigned_to: req.body.assigned_to || null,
      created_by: req.user.id
    };
    
    // Filter: remove undefined AND columns that don't exist in table
    const filteredData = Object.fromEntries(
      Object.entries(loanData)
        .filter(([key, value]) => value !== undefined && existingColumns.includes(key))
    );
    
    const keys = Object.keys(filteredData);
    const values = Object.values(filteredData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const result = await client.query(
      `INSERT INTO loans (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id, loan_number`,
      values
    );
    
    // If loan was created from a lead, mark the lead as converted
    if (filteredData.lead_id) {
      console.log(`Marking lead ${filteredData.lead_id} as converted...`);
      const updateResult = await client.query(
        'UPDATE leads SET converted_to_loan = true, loan_created_at = NOW() WHERE id = $1 RETURNING id, customer_name, converted_to_loan',
        [filteredData.lead_id]
      );
      if (updateResult.rows.length > 0) {
        console.log(`✅ Lead ${filteredData.lead_id} (${updateResult.rows[0].customer_name}) marked as converted:`, updateResult.rows[0].converted_to_loan);
      } else {
        console.log(`⚠️ Lead ${filteredData.lead_id} not found in database`);
      }
    } else {
      console.log('No lead_id provided - this is a direct loan creation');
    }
    
    await client.query('COMMIT');
    res.status(201).json({ 
      message: 'Loan created successfully', 
      id: result.rows[0].id,
      loan_number: result.rows[0].loan_number 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('=== LOAN CREATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('User:', req.user);
    console.error('========================');
    res.status(500).json({ 
      error: error.message,
      details: error.code || 'Unknown error',
      hint: error.hint || null
    });
  } finally {
    client.release();
  }
};

export const deleteLoan = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM loans WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    res.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Loan Application Stage
export const updateLoanApplicationStage = async (req, res) => {
  try {
    // Additional check for team leaders
    if (req.user.role === 'team_leader') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Team leaders cannot update loan application status. Please contact your manager.'
      });
    }
    
    const loanId = req.params.id;
    const { stage: newStage, ...stageData } = req.body;
    
    const result = await applicationStageLogic.updateLoanApplicationStage(
      loanId,
      newStage,
      stageData,
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Update loan application stage error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Loan Application Stage History
export const getLoanApplicationStageHistory = async (req, res) => {
  try {
    const loanId = req.params.id;
    const history = await applicationStageLogic.getLoanStageHistory(loanId);
    res.json(history);
  } catch (error) {
    console.error('Get loan application stage history error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateLoanStage = async (req, res) => {
  try {
    const loanId = req.params.id;
    const stageData = req.body;
    
    // Get current stage history
    const currentLoan = await db.query('SELECT stage_history FROM loans WHERE id = $1', [loanId]);
    const currentHistory = currentLoan.rows[0]?.stage_history || [];
    
    // Add new stage to history
    const updatedHistory = [...currentHistory, stageData];
    
    // Update the loan's current stage
    await db.query(
      'UPDATE loans SET application_stage = $1, stage_data = $2, stage_history = $3, updated_at = NOW() WHERE id = $4',
      [stageData.stage, JSON.stringify(stageData), JSON.stringify(updatedHistory), loanId]
    );
    
    // Handle auto-cancellation for APPROVED stage (30 days)
    if (stageData.stage === 'APPROVED' && stageData.approvedData) {
      console.log(`Scheduled auto-cancellation for loan ${loanId} after 30 days`);
    }
    
    res.json({ message: 'Loan stage updated successfully' });
  } catch (error) {
    console.error('Update loan stage error:', error);
    res.status(500).json({ error: error.message });
  }
};
