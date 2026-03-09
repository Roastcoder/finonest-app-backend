import db from '../config/database.js';
import { buildUpdateQuery } from '../utils/postgres.js';

export const getAllLoans = async (req, res) => {
  try {
    let query = `
      SELECT l.* 
      FROM loans l
    `;
    
    const conditions = [];
    const values = [];
    
    if (req.user.role === 'executive') {
      // Executive sirf apni loans dekhega
      conditions.push('l.created_by = $1');
      values.push(req.user.id);
    } else if (req.user.role === 'team_leader') {
      // Team leader apni aur apne team members ki loans dekhega
      const teamResult = await db.query(
        'SELECT id FROM users WHERE reporting_to = $1 OR id = $1',
        [req.user.id]
      );
      const teamIds = teamResult.rows.map(r => r.id);
      conditions.push(`l.created_by = ANY($1)`);
      values.push(teamIds);
    }
    // Admin/others ke liye koi filter nahi
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    const result = await db.query(query, values);
    return res.json(result.rows);
  } catch (error) {
    console.error('Get loans error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM loans WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get loan by ID error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const createLoan = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Creating loan with data:', req.body);
    
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
      ltv: req.body.ltv || null,
      loan_type_vehicle: req.body.loan_type_vehicle || null,
      vehicle_number: req.body.vehicle_number || null,
      maker_name: req.body.maker_name || null,
      model_variant_name: req.body.model_variant_name || null,
      mfg_year: req.body.mfg_year || null,
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

export const updateLoan = async (req, res) => {
  try {
    const { status, disbursement_date } = req.body;
    const { query, values } = buildUpdateQuery('loans', req.body, req.params.id);
    const result = await db.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (status === 'disbursed') {
      const loan = await db.query('SELECT * FROM loans WHERE id = $1', [req.params.id]);
      const lead = await db.query('SELECT * FROM leads WHERE customer_phone = $1', [loan.rows[0].customer_phone]);
      
      if (lead.rows.length > 0) {
        const dsaResult = await db.query(
          'SELECT id FROM users WHERE role = $1 AND id = (SELECT reporting_to FROM users WHERE id = $2)',
          ['dsa', lead.rows[0].assigned_to]
        );

        if (dsaResult.rows.length > 0) {
          await db.query(
            `INSERT INTO rc_folio_accounts (loan_id, dsa_id, opening_balance, current_balance)
             VALUES ($1, $2, $3, $3)`,
            [req.params.id, dsaResult.rows[0].id, loan.rows[0].loan_amount]
          );

          const payoutConfig = await db.query(
            'SELECT * FROM payout_config WHERE dsa_id = $1 AND bank_id = $2 AND payout_enabled = true',
            [dsaResult.rows[0].id, loan.rows[0].bank_id]
          );

          if (payoutConfig.rows.length > 0) {
            const payoutAmount = (loan.rows[0].loan_amount * payoutConfig.rows[0].payout_percentage) / 100;
            await db.query(
              `INSERT INTO payout_ledger (loan_id, dsa_id, disbursed_amount, payout_percentage, payout_amount)
               VALUES ($1, $2, $3, $4, $5)`,
              [req.params.id, dsaResult.rows[0].id, loan.rows[0].loan_amount, payoutConfig.rows[0].payout_percentage, payoutAmount]
            );
          }
        }
      }
    }

    res.json({ message: 'Loan updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
