import express from 'express';
import { getAllLoans, getLoanById, createLoan, deleteLoan, updateLoan, updateLoanStage, getBurstTable } from '../controllers/loanController.js';
import { authenticate, authorize, requireMinimumRole, validateResourceOwnership, applyDataFilters } from '../middleware/enhancedAuth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { uploadMiddleware, uploadDocument } from '../controllers/documentController.js';
import { toPostgresParams } from '../utils/postgres.js';
import db from '../config/database.js';

const router = express.Router();

// Apply authentication and data filters to all routes
router.use(authenticate);
router.use(applyDataFilters);

// Get all loans (with role-based filtering)
router.get('/', getAllLoans);

// Get burst table (requires dashboard view permission)
router.get('/burst-table', getBurstTable);

// Get loan documents (with ownership validation)
router.get('/:id/documents', validateResourceOwnership('loan'), async (req, res) => {
  try {
    const loanResult = await db.query('SELECT lead_id FROM loans WHERE id = $1', [req.params.id]);
    if (loanResult.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
    const { lead_id } = loanResult.rows[0];

    // Fetch documents with strict deduplication
    let docs;
    const hasLoanIdCol = await db.query(`SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='loan_id'`);
    if (hasLoanIdCol.rows.length > 0) {
      // Priority: loan_id documents first, then lead_id documents only if no loan_id version exists
      docs = await db.query(
        `WITH loan_docs AS (
          SELECT DISTINCT ON (document_type, file_name) d.*, 
                 COALESCE(u.full_name, u.user_id) as uploaded_by_name,
                 1 as priority
          FROM documents d
          LEFT JOIN users u ON d.uploaded_by = u.id
          WHERE d.loan_id = $1
          ORDER BY document_type, file_name, d.created_at DESC
        ),
        lead_docs AS (
          SELECT DISTINCT ON (document_type, file_name) d.*, 
                 COALESCE(u.full_name, u.user_id) as uploaded_by_name,
                 2 as priority
          FROM documents d
          LEFT JOIN users u ON d.uploaded_by = u.id
          WHERE $2::int IS NOT NULL AND d.lead_id = $2 AND d.loan_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM documents ld 
            WHERE ld.loan_id = $1 
            AND ld.document_type = d.document_type
          )
          ORDER BY document_type, file_name, d.created_at DESC
        )
        SELECT * FROM loan_docs
        UNION ALL
        SELECT * FROM lead_docs
        ORDER BY priority, document_type, created_at DESC`,
        [req.params.id, lead_id || null]
      );
    } else {
      if (!lead_id) return res.json([]);
      docs = await db.query(
        `SELECT DISTINCT ON (document_type, file_name) d.*, 
               COALESCE(u.full_name, u.user_id) as uploaded_by_name
         FROM documents d
         LEFT JOIN users u ON d.uploaded_by = u.id
         WHERE d.lead_id = $1
         ORDER BY document_type, file_name, d.created_at DESC`,
        [lead_id]
      );
    }
    res.json(docs.rows);
  } catch (error) {
    console.error('Get loan documents error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Upload loan documents (with ownership validation)
router.post('/:id/documents', validateResourceOwnership('loan'), uploadMiddleware, uploadDocument);

// Convert loan to lead (requires minimum team_leader role)
router.post('/:id/convert-to-lead', requireMinimumRole('team_leader'), async (req, res) => {
  try {
    const loanId = req.params.id;
    
    // Get loan data
    const loanResult = await db.query('SELECT * FROM loans WHERE id = $1', [loanId]);
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    const loan = loanResult.rows[0];
    
    // Generate customer_id for new lead
    const userResult = await db.query('SELECT COALESCE(full_name, user_id, \'US\') as user_name FROM users WHERE id = $1', [req.user.id]);
    const userName = userResult.rows[0]?.user_name || 'User';
    const userInitials = userName.substring(0, 2).toUpperCase();
    const customerInitial = (loan.applicant_name || 'C').charAt(0).toUpperCase();
    
    const seqResult = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
       FROM leads WHERE created_by = $1 AND customer_id ~ '^[A-Z]{2}[A-Z]\\d+$'`,
      [req.user.id]
    );
    let seq = seqResult.rows[0]?.next_seq || 1;
    const customerId = `${userInitials}${customerInitial}${String(seq).padStart(3, '0')}`;
    
    // Create lead from loan data
    const leadData = {
      customer_id: customerId,
      customer_name: loan.applicant_name,
      phone: loan.mobile,
      loan_amount_required: loan.loan_amount,
      vehicle_number: loan.vehicle_number,
      current_address: loan.current_address || loan.address,
      current_landmark: loan.current_landmark || loan.landmark,
      city: loan.current_district || loan.city,
      state: loan.current_state || loan.state,
      pincode: loan.current_pincode || loan.pincode,
      pan_number: loan.pan_number,
      case_type: loan.case_type,
      financier_id: loan.bank_id,
      stage: 'lead',
      status: 'new',
      source: 'converted_from_loan',
      notes: `Converted from loan ${loan.loan_number || loan.id}`,
      created_by: req.user.id,
      assigned_to: loan.assigned_to || req.user.id,
      application_stage: 'SUBMITTED',
      stage_data: {
        stage: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        submittedBy: req.user.id
      },
      stage_history: [{
        stage: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        submittedBy: req.user.id,
        action: 'Converted from loan'
      }],
      converted_to_loan: false
    };
    
    // Filter out null/undefined values
    const filteredData = Object.fromEntries(
      Object.entries(leadData).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );
    
    const { keys, values, params } = toPostgresParams(filteredData);
    const leadResult = await db.query(
      `INSERT INTO leads (${keys.join(', ')}) VALUES (${params}) RETURNING id`,
      values
    );
    
    const newLeadId = leadResult.rows[0].id;
    
    // Update documents to point to new lead
    await db.query(
      'UPDATE documents SET lead_id = $1, loan_id = NULL WHERE loan_id = $2',
      [newLeadId, loanId]
    );
    
    // Delete the loan
    await db.query('DELETE FROM loans WHERE id = $1', [loanId]);
    
    res.json({ 
      success: true, 
      leadId: newLeadId,
      customerId: customerId,
      message: 'Loan converted to lead successfully'
    });
  } catch (error) {
    console.error('Convert to lead error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Get loan by ID (with ownership validation)
router.get('/:id', validateResourceOwnership('loan'), getLoanById);

// Create new loan (requires loans.create permission)
router.post('/', auditLogger('loans', 'CREATE_LOAN'), createLoan);

// Update loan (with ownership validation)
router.put('/:id', validateResourceOwnership('loan'), auditLogger('loans', 'UPDATE_LOAN'), updateLoan);

// Delete loan (admin only)
router.delete('/:id', authorize('admin'), auditLogger('loans', 'DELETE_LOAN'), deleteLoan);

// Update loan stage (requires loans.updateStage permission and ownership validation)
router.put('/:id/stage', validateResourceOwnership('loan'), auditLogger('loans', 'UPDATE_STAGE'), updateLoanStage);

export default router;
