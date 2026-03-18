import db from '../config/database.js';
import { buildUpdateQuery } from '../utils/postgres.js';
import applicationStageLogic from '../utils/enhancedApplicationStageLogic.js';

export const getAllLoans = async (req, res) => {
  try {
    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             COALESCE(b.name, l.financier_name) as bank_name,
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
      LEFT JOIN users creator ON l.created_by = creator.id
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
    } else if (req.user.role === 'manager' || req.user.role === 'sales_manager' || req.user.role === 'dsa' || req.user.role === 'branch_manager') {
      // Manager, DSA, and Branch Manager can see loans created by their team
      conditions.push(`(
        l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $1 OR dsa_id = $1
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        )
        OR l.assigned_to = $1
        OR l.created_by = $1
      )`);
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
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             COALESCE(b.name, l.financier_name) as bank_name,
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
      LEFT JOIN users creator ON l.created_by = creator.id
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
    } else if (req.user.role === 'manager' || req.user.role === 'sales_manager' || req.user.role === 'dsa' || req.user.role === 'branch_manager') {
      query += ` AND (
        l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $2 OR dsa_id = $2
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        )
        OR l.assigned_to = $2
        OR l.created_by = $2
      )`;
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
      current_landmark: req.body.current_landmark || req.body.landmark || null,
      landmark: req.body.current_landmark || req.body.landmark || null,
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
      company_name: req.body.company_name || null,
      designation: req.body.designation || null,
      work_experience: req.body.work_experience || null,
      current_job_years: req.body.current_job_years || null,
      total_work_exp: req.body.total_work_exp || null,
      net_monthly_salary: req.body.net_monthly_salary || null,
      salary_credit_mode: req.body.salary_credit_mode || null,
      salary_slip_available: req.body.salary_slip_available || null,
      profile: req.body.profile || null,
      itr_available: req.body.itr_available || null,
      annual_income_itr: req.body.annual_income_itr || null,
      business_name: req.body.business_name || null,
      business_type: req.body.business_type || null,
      business_vintage: req.body.business_vintage || null,
      professional_subtype: req.body.professional_subtype || null,
      practice_experience: req.body.practice_experience || null,
      freelancer_subtype: req.body.freelancer_subtype || null,
      other_income_type: req.body.other_income_type || null,
      selected_financier: req.body.selected_financier || null,
      financier_location: req.body.financier_location || null,
      loan_amount: req.body.loan_amount || 0,
      application_stage: applicationStageLogic.APPLICATION_STAGES.SUBMITTED,
      ltv: req.body.ltv || null,
      loan_type_vehicle: req.body.loan_type_vehicle || null,
      vehicle_number: req.body.vehicle_number || null,
      case_type: req.body.case_type || null,
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
      existing_loan_status: req.body.existing_loan_status || null,
      existing_loan_amount: req.body.existing_loan_amount ? Number(req.body.existing_loan_amount) : null,
      existing_tenure: req.body.existing_tenure ? Number(req.body.existing_tenure) : null,
      existing_emi: req.body.existing_emi ? Number(req.body.existing_emi) : null,
      no_of_emi_paid: req.body.no_of_emi_paid ? Number(req.body.no_of_emi_paid) : null,
      bouncing_3_months: req.body.bouncing_last_3m != null ? Number(req.body.bouncing_last_3m) : (req.body.bouncing_3_months != null ? Number(req.body.bouncing_3_months) : null),
      bouncing_6_months: req.body.bouncing_last_6m != null ? Number(req.body.bouncing_last_6m) : (req.body.bouncing_6_months != null ? Number(req.body.bouncing_6_months) : null),
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
        'UPDATE leads SET converted_to_loan = true, loan_created_at = NOW(), application_stage = \'DISBURSED\' WHERE id = $1 RETURNING id, customer_name, converted_to_loan',
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

export const updateLoan = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const loanId = req.params.id;
    
    // Get existing columns from loans table
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans'
    `);
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    
    // Build update data with all possible fields
    const updateData = {
      existing_loan_status: req.body.existing_loan_status !== undefined ? req.body.existing_loan_status : undefined,
      existing_loan_amount: req.body.existing_loan_amount !== undefined ? Number(req.body.existing_loan_amount) : undefined,
      existing_tenure: req.body.existing_tenure !== undefined ? Number(req.body.existing_tenure) : undefined,
      existing_emi: req.body.existing_emi !== undefined ? Number(req.body.existing_emi) : undefined,
      no_of_emi_paid: req.body.no_of_emi_paid !== undefined ? Number(req.body.no_of_emi_paid) : undefined,
      bouncing_3_months: req.body.bouncing_3_months !== undefined ? Number(req.body.bouncing_3_months) : undefined,
      bouncing_6_months: req.body.bouncing_6_months !== undefined ? Number(req.body.bouncing_6_months) : undefined,
      applicant_name: req.body.applicant_name,
      mobile: req.body.mobile,
      email: req.body.email,
      co_applicant_name: req.body.co_applicant_name,
      co_applicant_mobile: req.body.co_applicant_mobile,
      guarantor_name: req.body.guarantor_name,
      guarantor_mobile: req.body.guarantor_mobile,
      current_address: req.body.current_address,
      current_landmark: req.body.current_landmark,
      current_district: req.body.current_district,
      current_state: req.body.current_state,
      current_pincode: req.body.current_pincode,
      vehicle_number: req.body.vehicle_number,
      maker_name: req.body.maker_name,
      model_variant_name: req.body.model_variant_name,
      engine_number: req.body.engine_number,
      chassis_number: req.body.chassis_number,
      owner_name: req.body.owner_name,
      fuel_type: req.body.fuel_type,
      manufacturing_date: req.body.manufacturing_date,
      ownership_type: req.body.ownership_type,
      financer: req.body.financer,
      finance_status: req.body.finance_status,
      insurance_company: req.body.insurance_company,
      insurance_valid_upto: req.body.insurance_valid_upto,
      pucc_valid_upto: req.body.pucc_valid_upto,
      case_type: req.body.case_type,
      emi_amount: req.body.emi_amount,
      tenure: req.body.tenure,
      total_interest: req.body.total_interest,
      loan_amount: req.body.loan_amount,
      selected_financier: req.body.selected_financier,
      financier_location: req.body.financier_location,
      financier_name: req.body.financier_name,
      insurance_company_name: req.body.insurance_company_name,
      premium_amount: req.body.premium_amount,
      total_deduction: req.body.total_deduction,
      net_disbursement_amount: req.body.net_disbursement_amount,
      payment_received_date: req.body.payment_received_date,
      rc_owner_name: req.body.rc_owner_name,
      rto_agent_name: req.body.rto_agent_name,
      agent_mobile_no: req.body.agent_mobile_no,
      login_date: req.body.login_date,
      approval_date: req.body.approval_date,
      assigned_to: req.body.assigned_to,
      // Income fields
      income_source: req.body.income_source,
      monthly_income: req.body.monthly_income !== undefined ? (req.body.monthly_income ? Number(req.body.monthly_income) : null) : undefined,
      company_name: req.body.company_name,
      designation: req.body.designation,
      work_experience: req.body.work_experience,
      current_job_years: req.body.current_job_years,
      total_work_exp: req.body.total_work_exp,
      net_monthly_salary: req.body.net_monthly_salary !== undefined ? (Number(req.body.net_monthly_salary) || null) : undefined,
      salary_credit_mode: req.body.salary_credit_mode,
      salary_slip_available: req.body.salary_slip_available,
      profile: req.body.profile,
      itr_available: req.body.itr_available,
      annual_income_itr: req.body.annual_income_itr !== undefined ? (Number(req.body.annual_income_itr) || null) : undefined,
      business_name: req.body.business_name,
      business_type: req.body.business_type,
      business_vintage: req.body.business_vintage,
      professional_subtype: req.body.professional_subtype,
      practice_experience: req.body.practice_experience,
      freelancer_subtype: req.body.freelancer_subtype,
      other_income_type: req.body.other_income_type,
      our_branch: req.body.our_branch,
      sourcing_person_name: req.body.sourcing_person_name,
      remark: req.body.remark,
    };
    
    // Filter: remove undefined AND columns that don't exist in table
    const filteredData = Object.fromEntries(
      Object.entries(updateData)
        .filter(([key, value]) => value !== undefined && existingColumns.includes(key))
    );
    
    if (Object.keys(filteredData).length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Build SET clause
    const setClause = Object.keys(filteredData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    
    const values = [...Object.values(filteredData), loanId];
    
    const result = await client.query(
      `UPDATE loans SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Loan updated successfully', loan: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update loan error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
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
    
    console.log('Updating loan stage:', { loanId, stageData });
    
    // Validate required fields
    if (!stageData.stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    // Get current loan data
    const currentLoan = await db.query(
      'SELECT application_stage, stage_history, stage_data FROM loans WHERE id = $1', 
      [loanId]
    );
    
    if (currentLoan.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    // Parse existing history (handle both string and object formats)
    let currentHistory = [];
    try {
      const historyData = currentLoan.rows[0]?.stage_history;
      if (historyData) {
        currentHistory = typeof historyData === 'string' ? JSON.parse(historyData) : historyData;
        if (!Array.isArray(currentHistory)) {
          currentHistory = [];
        }
      }
    } catch (parseError) {
      console.log('Error parsing stage_history, starting with empty array:', parseError.message);
      currentHistory = [];
    }
    
    // Create new stage entry with timestamp
    const newStageEntry = {
      ...stageData,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };
    
    // Add new stage to history
    const updatedHistory = [...currentHistory, newStageEntry];
    
    console.log('Updating with data:', {
      stage: stageData.stage,
      stageData: newStageEntry,
      historyLength: updatedHistory.length
    });
    
    // Build extra column updates for stage-specific fields
    const extraCols = [];
    const extraVals = [];

    if (stageData.stage === 'LOGIN') {
      extraCols.push('app_score', 'credit_score');
      extraVals.push(stageData.appScore || null, stageData.creditScore || null);
    } else if (stageData.stage === 'IN_PROCESS') {
      extraCols.push('tags');
      extraVals.push(stageData.tags || []);
    } else if (stageData.stage === 'APPROVED') {
      extraCols.push('roi', 'tenure', 'approval_remarks');
      extraVals.push(stageData.roi || null, stageData.tenure || null, stageData.loanAmount ? `Approved amount: ${stageData.loanAmount}` : null);
    } else if (stageData.stage === 'DISBURSED') {
      extraCols.push('roi', 'tenure', 'loan_account_number', 'rc_type', 'rc_collected_by', 'disbursement_date', 'rto_agent_name_rc', 'rto_agent_mobile', 'banker_name', 'banker_mobile');
      extraVals.push(stageData.roi || null, stageData.tenure || null, stageData.loanAccountNumber || null, stageData.rcType || null, stageData.collectedBy || null, new Date().toISOString(), stageData.agentName || null, stageData.agentMobile || null, stageData.bankerName || null, stageData.bankerMobile || null);
    } else if (stageData.stage === 'REJECTED') {
      extraCols.push('rejection_remarks');
      extraVals.push(stageData.remarks || null);
    } else if (stageData.stage === 'CANCELLED') {
      extraCols.push('cancellation_remarks');
      extraVals.push(stageData.remarks || null);
    }

    // Base params: $1=stage, $2=stage_data, $3=stage_history, then extra cols, last=loanId
    const baseVals = [stageData.stage, newStageEntry, updatedHistory, ...extraVals, loanId];
    const extraSetClauses = extraCols.map((col, i) => `${col} = $${i + 4}`).join(', ');
    const idParam = `$${baseVals.length}`;
    const extraSet = extraSetClauses ? `, ${extraSetClauses}` : '';

    // Update the loan's current stage
    const updateResult = await db.query(
      `UPDATE loans 
       SET application_stage = $1, 
           stage_data = $2, 
           stage_history = $3
           ${extraSet},
           stage_changed_at = NOW(),
           updated_at = NOW() 
       WHERE id = ${idParam}
       RETURNING id, application_stage`,
      baseVals
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Failed to update loan stage' });
    }
    
    console.log('Loan stage updated successfully:', updateResult.rows[0]);
    
    res.json({ 
      message: 'Loan stage updated successfully',
      loan: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update loan stage error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to update loan application stage'
    });
  }
};
