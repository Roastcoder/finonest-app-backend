import express from 'express';
import db from '../config/database.js';
import { authenticate  } from '../middleware/enhancedAuth.js';

const router = express.Router();

// Save loan draft
router.post('/', authenticate, async (req, res) => {
  try {
    const { lead_id, form_data, assignment_data, draft_id } = req.body;
    
    if (!form_data || !form_data.customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    let result;
    
    // If draft_id is provided, update existing draft
    if (draft_id) {
      result = await db.query(
        `UPDATE loan_drafts 
         SET form_data = $1, assignment_data = $2, lead_id = $3, updated_at = NOW()
         WHERE id = $4 AND created_by = $5
         RETURNING id`,
        [JSON.stringify(form_data), JSON.stringify(assignment_data), lead_id || null, draft_id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found or unauthorized' });
      }
    } 
    // If lead_id is provided, check if draft exists for this lead
    else if (lead_id) {
      // Check if draft exists for this lead
      const existingDraft = await db.query(
        `SELECT id FROM loan_drafts WHERE lead_id = $1 AND created_by = $2`,
        [lead_id, req.user.id]
      );
      
      if (existingDraft.rows.length > 0) {
        // Update existing draft
        result = await db.query(
          `UPDATE loan_drafts 
           SET form_data = $1, assignment_data = $2, updated_at = NOW()
           WHERE lead_id = $3 AND created_by = $4
           RETURNING id`,
          [JSON.stringify(form_data), JSON.stringify(assignment_data), lead_id, req.user.id]
        );
      } else {
        // Create new draft
        result = await db.query(
          `INSERT INTO loan_drafts (lead_id, form_data, assignment_data, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id`,
          [lead_id, JSON.stringify(form_data), JSON.stringify(assignment_data), req.user.id]
        );
      }
    }
    // No lead_id, create new draft without lead association
    else {
      result = await db.query(
        `INSERT INTO loan_drafts (lead_id, form_data, assignment_data, created_by, created_at, updated_at)
         VALUES (NULL, $1, $2, $3, NOW(), NOW())
         RETURNING id`,
        [JSON.stringify(form_data), JSON.stringify(assignment_data), req.user.id]
      );
    }

    res.status(201).json({ 
      message: 'Loan draft saved successfully', 
      draftId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Save loan draft error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get loan draft by lead ID
router.get('/lead/:leadId', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM loan_drafts WHERE lead_id = $1 AND created_by = $2 ORDER BY updated_at DESC LIMIT 1`,
      [req.params.leadId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No draft found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get loan draft error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all drafts for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ld.*, l.customer_name as lead_customer_name, l.customer_id as lead_customer_id
       FROM loan_drafts ld
       LEFT JOIN leads l ON ld.lead_id = l.id
       WHERE ld.created_by = $1
       ORDER BY ld.updated_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get loan drafts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get draft by ID
router.get('/:draftId', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM loan_drafts WHERE id = $1 AND created_by = $2`,
      [req.params.draftId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get loan draft error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete loan draft
router.delete('/:draftId', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM loan_drafts WHERE id = $1 RETURNING id`,
      [req.params.draftId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Delete loan draft error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
