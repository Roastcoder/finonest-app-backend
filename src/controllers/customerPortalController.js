import db from '../config/database.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const requestOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = generateOTP();
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const leadResult = await db.query('SELECT id FROM leads WHERE phone = $1', [phone]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'No application found with this phone number' });
    }

    const lead_id = leadResult.rows[0].id;
    
    await db.query(
      `INSERT INTO customer_portal_access (lead_id, customer_phone, otp, otp_expiry) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (lead_id) DO UPDATE SET otp = $3, otp_expiry = $4`,
      [lead_id, phone, otp, otp_expiry]
    );

    // TODO: Send OTP via SMS gateway
    res.json({ message: 'OTP sent successfully', otp }); // Remove otp in production
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const result = await db.query(
      `SELECT * FROM customer_portal_access 
       WHERE customer_phone = $1 AND otp = $2 AND otp_expiry > NOW()`,
      [phone, otp]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const access_token = Buffer.from(`${phone}:${Date.now()}`).toString('base64');
    const token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(
      `UPDATE customer_portal_access 
       SET access_token = $1, token_expiry = $2, last_login = NOW() 
       WHERE id = $3`,
      [access_token, token_expiry, result.rows[0].id]
    );

    res.json({ message: 'Login successful', access_token, lead_id: result.rows[0].lead_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerApplicationStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    const result = await db.query(
      `SELECT l.id, l.customer_name, l.stage, l.loan_amount_required, l.created_at,
              u.name as executive_name, u.phone as executive_phone,
              ln.status as loan_status, ln.disbursement_date, ln.emi_amount, ln.tenure_months
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       LEFT JOIN loans ln ON ln.id = (SELECT id FROM loans WHERE customer_phone = l.phone LIMIT 1)
       WHERE l.id = $1`,
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const documents = await db.query(
      'SELECT document_type, status FROM documents WHERE lead_id = $1',
      [leadId]
    );

    res.json({
      application: result.rows[0],
      documents: documents.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
