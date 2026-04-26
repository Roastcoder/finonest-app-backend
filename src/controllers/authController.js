import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import https from 'https';
import http from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import SecurityAudit from '../middleware/securityAudit.js';

// Multer for profile photo uploads
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'profile-photos');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `photo-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /jpeg|jpg|png/.test(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG/PNG allowed'));
  }
});
export const photoUploadMiddleware = photoUpload.single('photo');

// In-memory OTP store: { phone: { otp, expiresAt } }
const mobileOtpStore = new Map();
const mpinOtpStore = new Map();

const sendSarvSms = (phone, otp) => {
  return new Promise((resolve, reject) => {
    const template = `Hi! ${otp} is your OTP to log in to Finonest Pro. The code is valid for just 3 mins. -Team Finonest`;
    const params = new URLSearchParams({
      token: '1507603797696c62b571b953.18331010',
      user_id: '50962153',
      route: 'OT',
      template_id: '16212',
      sender_id: 'FINOST',
      language: 'EN',
      template: template,
      contact_numbers: phone
    });
    const url = `https://m1.sarv.com/api/v2.0/sms_campaign.php?${params.toString()}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No photo uploaded' });
    const relativePath = `uploads/profile-photos/${req.file.filename}`;
    // Delete old photo if exists
    const old = await db.query('SELECT photo_path FROM users WHERE id = $1', [req.user.id]);
    if (old.rows[0]?.photo_path) {
      const oldFile = path.join(process.cwd(), old.rows[0].photo_path);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    await db.query('UPDATE users SET photo_path = $1 WHERE id = $2', [relativePath, req.user.id]);
    res.json({ success: true, photo_path: relativePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No photo uploaded' });
    const relativePath = `uploads/profile-photos/${req.file.filename}`;
    res.json({ success: true, photo_path: relativePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid mobile number' });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    mobileOtpStore.set(phone, { otp, expiresAt: Date.now() + 3 * 60 * 1000 });
    await sendSarvSms(phone, otp);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send mobile OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
};

export const verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
    }
    const record = mobileOtpStore.get(phone);
    if (!record) {
      return res.status(400).json({ success: false, error: 'OTP not found. Please request a new OTP.' });
    }
    if (Date.now() > record.expiresAt) {
      mobileOtpStore.delete(phone);
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new OTP.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
    }
    mobileOtpStore.delete(phone);
    res.json({ success: true, message: 'Mobile number verified successfully' });
  } catch (error) {
    console.error('Verify mobile OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

export const forgotMpin = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number' });
    }
    
    // Check if user exists
    const userResult = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Phone number not registered' });
    }
    
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    mpinOtpStore.set(phone, { otp, expiresAt: Date.now() + 3 * 60 * 1000 });
    
    await sendSarvSms(phone, otp);
    console.log(`MPIN Reset OTP sent to ${phone}: ${otp}`);
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Forgot MPIN error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const resetMpin = async (req, res) => {
  try {
    const { phone, otp, newMpin } = req.body;
    
    if (!phone || !otp || !newMpin) {
      return res.status(400).json({ success: false, message: 'Phone, OTP, and new MPIN are required' });
    }
    
    if (newMpin.length !== 4 || !/^\d{4}$/.test(newMpin)) {
      return res.status(400).json({ success: false, message: 'MPIN must be 4 digits' });
    }
    
    // Verify OTP
    const record = mpinOtpStore.get(phone);
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new OTP.' });
    }
    
    if (Date.now() > record.expiresAt) {
      mpinOtpStore.delete(phone);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }
    
    // Hash new MPIN and update
    const hashedMpin = await bcrypt.hash(newMpin, 10);
    await db.query('UPDATE users SET password = $1 WHERE phone = $2', [hashedMpin, phone]);
    
    mpinOtpStore.delete(phone);
    console.log(`MPIN reset successfully for ${phone}`);
    
    res.json({ success: true, message: 'MPIN reset successfully' });
  } catch (error) {
    console.error('Reset MPIN error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset MPIN' });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      await SecurityAudit.logAuthEvent('LOGIN_FAILED', null, { reason: 'Missing credentials', phone }, req);
      return res.status(400).json({ error: 'Phone and password are required' });
    }
    
    const result = await db.query(`
      SELECT u.*, m.name as manager_name, m.full_name as manager_full_name, m.role as manager_role
      FROM users u
      LEFT JOIN users m ON u.reporting_to = m.id
      WHERE u.phone = $1
    `, [phone]);
    
    if (result.rows.length === 0) {
      await SecurityAudit.logAuthEvent('LOGIN_FAILED', null, { reason: 'User not found', phone }, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      // Increment failed login attempts
      await db.query(
        'UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1 WHERE id = $1',
        [user.id]
      );
      
      await SecurityAudit.logAuthEvent('LOGIN_FAILED', user.id, { reason: 'Invalid password' }, req);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user account is pending approval
    if (user.status === 'pending') {
      await SecurityAudit.logAuthEvent('LOGIN_BLOCKED', user.id, { reason: 'Account pending approval' }, req);
      return res.status(403).json({ 
        error: 'Account Pending For Verification. Retry Login After 5 Mins.',
        status: user.status 
      });
    }

    // Check if account is suspended or inactive
    if (user.status === 'suspended') {
      await SecurityAudit.logAuthEvent('ACCOUNT_SUSPENDED', user.id, { reason: 'Account suspended' }, req);
      return res.status(403).json({ 
        error: 'Your account has been suspended. Please contact admin.',
        status: user.status 
      });
    }

    if (user.status === 'inactive') {
      await SecurityAudit.logAuthEvent('LOGIN_BLOCKED', user.id, { reason: 'Account inactive' }, req);
      return res.status(403).json({ 
        error: 'Your account is inactive. Please contact admin.',
        status: user.status 
      });
    }

    // Check for account lockout due to failed attempts
    if (user.failed_login_attempts >= 5) {
      await SecurityAudit.logAuthEvent('ACCOUNT_LOCKED', user.id, { 
        reason: 'Too many failed attempts', 
        attempts: user.failed_login_attempts 
      }, req);
      return res.status(403).json({ 
        error: 'Account locked due to multiple failed login attempts. Please contact administrator.',
        status: 'locked' 
      });
    }

    // Reset failed login attempts on successful login
    await db.query(
      'UPDATE users SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Log successful login
    await SecurityAudit.logAuthEvent('LOGIN_SUCCESS', user.id, { 
      role: user.role,
      loginTime: new Date().toISOString()
    }, req);

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name || user.full_name, 
        phone: user.phone, 
        role: user.role,
        manager_name: user.manager_name || user.manager_full_name,
        manager_role: user.manager_role,
        branch_id: user.branch_id,
        refer_code: user.refer_code,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    await SecurityAudit.logAuthEvent('LOGIN_FAILED', null, { 
      reason: 'System error', 
      error: error.message 
    }, req);
    res.status(500).json({ error: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { 
      name, 
      password, 
      phone, 
      role = 'executive',
      refer_code,
      pan_number,
      aadhaar_number,
      pan_data,
      aadhaar_data,
      photo_path
    } = req.body;
    
    // Validate required fields
    if (!name || !phone || !password) {
      await SecurityAudit.logAuthEvent('SIGNUP_FAILED', null, { 
        reason: 'Missing required fields', 
        phone 
      }, req);
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if phone already exists
    const existingUser = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUser.rows.length > 0) {
      await SecurityAudit.logAuthEvent('SIGNUP_FAILED', null, { 
        reason: 'Phone already exists', 
        phone 
      }, req);
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    
    // Check if PAN number already exists (if provided)
    if (pan_number) {
      const existingPan = await db.query('SELECT id, name, full_name FROM users WHERE pan_number = $1', [pan_number]);
      if (existingPan.rows.length > 0) {
        const existingUserName = existingPan.rows[0].name || existingPan.rows[0].full_name;
        await SecurityAudit.logAuthEvent('SIGNUP_FAILED', null, { 
          reason: 'PAN already exists', 
          pan_number,
          existing_user: existingUserName 
        }, req);
        return res.status(400).json({ 
          error: `This PAN number is already registered with ${existingUserName}. Please use a different PAN number or contact support.`,
          errorType: 'PAN_EXISTS'
        });
      }
    }
    
    // Check if Aadhaar number already exists (if provided)
    if (aadhaar_number) {
      const existingAadhaar = await db.query('SELECT id, name, full_name FROM users WHERE aadhaar_number = $1', [aadhaar_number]);
      if (existingAadhaar.rows.length > 0) {
        const existingUserName = existingAadhaar.rows[0].name || existingAadhaar.rows[0].full_name;
        await SecurityAudit.logAuthEvent('SIGNUP_FAILED', null, { 
          reason: 'Aadhaar already exists', 
          aadhaar_number,
          existing_user: existingUserName 
        }, req);
        return res.status(400).json({ 
          error: `This Aadhaar number is already registered with ${existingUserName}. Please use a different Aadhaar number or contact support.`,
          errorType: 'AADHAAR_EXISTS'
        });
      }
    }
    
    // Determine status and reporting_to based on refer code
    let finalStatus = 'pending'; // Default to pending approval
    let reportingTo = null;
    let approvalMessage = 'Account created successfully! Please wait for admin approval to login.';
    
    // Handle refer code logic for executives
    if (role === 'executive' && refer_code) {
      // Find the user with this refer code
      const referrerResult = await db.query(
        `SELECT id, role, name, full_name FROM users 
         WHERE refer_code = $1 AND role = ANY($2)`,
        [refer_code, ['branch_manager', 'dsa', 'sales_manager', 'team_leader']]
      );
      
      if (referrerResult.rows.length === 0) {
        await SecurityAudit.logAuthEvent('SIGNUP_FAILED', null, { 
          reason: 'Invalid refer code', 
          refer_code,
          phone 
        }, req);
        return res.status(400).json({ error: 'Invalid refer code. Please check and try again.' });
      }
      
      const referrer = referrerResult.rows[0];
      
      // Auto-approve and assign to referrer's team
      finalStatus = 'active';
      reportingTo = referrer.id;
      approvalMessage = 'Account created successfully! You can now login and start working.';
      
      console.log(`Executive ${name} joining ${referrer.name || referrer.full_name}'s team via refer code ${refer_code}`);
    }
    
    // Admin and sales_manager roles are auto-approved
    if (['admin', 'sales_manager'].includes(role)) {
      finalStatus = 'active';
      approvalMessage = 'Account created successfully! You can now login.';
    }
    
    // DSA always needs approval regardless of refer code
    if (role === 'dsa') {
      finalStatus = 'pending';
      approvalMessage = 'DSA account created successfully! Please wait for admin approval to login.';
    }
    
    // Generate unique user ID in format FN00001
    const seqResult = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM 'FN(\\d+)') AS INTEGER)), 0) + 1 as next_seq
       FROM users WHERE user_id LIKE 'FN%'`
    );
    const sequence = String(seqResult.rows[0].next_seq).padStart(5, '0');
    const userId = `FN${sequence}`;
    
    // Insert user with complete KYC data
    const result = await db.query(
      `INSERT INTO users (
        user_id, name, full_name, password, phone, role, status, reporting_to, 
        pan_number, aadhaar_number, pan_data, aadhaar_data, pan_verified, aadhaar_verified,
        date_of_birth, gender, father_name, address_line1, address_line2, city, state, pincode, country,
        kyc_completed, photo_path, failed_login_attempts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26) 
       RETURNING id, user_id, name, full_name, phone, role, status, pan_verified, aadhaar_verified, kyc_completed`,
      [
        userId, name, name, hashedPassword, phone || null, role, finalStatus, reportingTo,
        pan_number || null, aadhaar_number || null,
        pan_data ? JSON.stringify(pan_data) : null,
        aadhaar_data ? JSON.stringify(aadhaar_data) : null,
        !!pan_data, !!aadhaar_data,
        pan_data?.dob || aadhaar_data?.date_of_birth || null,
        pan_data?.gender || aadhaar_data?.gender || null,
        aadhaar_data?.father_name || null,
        pan_data?.address?.line_1 || aadhaar_data?.address?.split(',')[0] || null,
        pan_data?.address?.line_2 || null,
        pan_data?.address?.city || aadhaar_data?.address?.split(',')[1] || null,
        pan_data?.address?.state || aadhaar_data?.address?.split(',')[2] || null,
        pan_data?.address?.zip || null,
        pan_data?.address?.country || 'INDIA',
        !!(pan_data && aadhaar_data),
        photo_path || null,
        0 // Initialize failed_login_attempts to 0
      ]
    );
    
    const user = result.rows[0];
    
    // Log successful signup
    await SecurityAudit.logAuthEvent('SIGNUP_SUCCESS', user.id, { 
      role,
      status: finalStatus,
      refer_code: refer_code || null,
      auto_approved: finalStatus === 'active'
    }, req);
    
    res.status(201).json({ 
      message: approvalMessage,
      userId: user.id,
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name || user.full_name,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      approved_via_refer: !!(refer_code && role === 'executive' && finalStatus === 'active'),
      requires_approval: finalStatus === 'pending',
      approval_type: finalStatus === 'pending' ? (role === 'dsa' ? 'DSA_APPROVAL' : 'ADMIN_APPROVAL') : null
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    
    await SecurityAudit.logAuthEvent('SIGNUP_FAILED', null, { 
      reason: 'System error', 
      error: error.message,
      phone: req.body.phone 
    }, req);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Phone number already exists' });
    }
    
    if (error.code === '42P01') {
      return res.status(500).json({ error: 'Database table not found. Please contact administrator.' });
    }
    
    res.status(500).json({ error: `Failed to create account: ${error.message}` });
  }
};

export const checkPan = async (req, res) => {
  try {
    const { pan_number } = req.body;
    
    if (!pan_number || pan_number.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid PAN number format' 
      });
    }
    
    // Check if PAN number already exists
    const existingPan = await db.query('SELECT id, name, full_name FROM users WHERE pan_number = $1', [pan_number]);
    if (existingPan.rows.length > 0) {
      const existingUserName = existingPan.rows[0].name || existingPan.rows[0].full_name;
      return res.status(400).json({ 
        success: false,
        error: `This PAN number is already registered with ${existingUserName}. Please use a different PAN number or contact support.`,
        errorType: 'PAN_EXISTS'
      });
    }
    
    // PAN is available
    res.json({
      success: true,
      message: 'PAN number is available for registration'
    });
    
  } catch (error) {
    console.error('Check PAN error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check PAN availability' 
    });
  }
};

export const checkAadhaar = async (req, res) => {
  try {
    const { aadhaar_number } = req.body;
    
    if (!aadhaar_number || aadhaar_number.length !== 12) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Aadhaar number format' 
      });
    }
    
    // Check if Aadhaar number already exists
    const existingAadhaar = await db.query('SELECT id, name, full_name FROM users WHERE aadhaar_number = $1', [aadhaar_number]);
    if (existingAadhaar.rows.length > 0) {
      const existingUserName = existingAadhaar.rows[0].name || existingAadhaar.rows[0].full_name;
      return res.status(400).json({ 
        success: false,
        error: `This Aadhaar number is already registered with ${existingUserName}. Please use a different Aadhaar number or contact support.`,
        errorType: 'AADHAAR_EXISTS'
      });
    }
    
    // Aadhaar is available
    res.json({
      success: true,
      message: 'Aadhaar number is available for registration'
    });
    
  } catch (error) {
    console.error('Check Aadhaar error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check Aadhaar availability' 
    });
  }
};

export const updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    await db.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, req.user.id]);
    res.json({ success: true, message: 'Phone updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add endpoint to get unmasked Aadhaar for authorized users
export const getUnmaskedAadhaar = async (req, res) => {
  try {
    // Only allow admin or the user themselves to view unmasked Aadhaar
    const targetUserId = req.params.userId || req.user.id;
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(targetUserId)) {
      return res.status(403).json({ error: 'Unauthorized to view this data' });
    }
    
    const result = await db.query(
      'SELECT aadhaar_number FROM users WHERE id = $1',
      [targetUserId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const aadhaarNumber = result.rows[0].aadhaar_number;
    
    // If it's masked, we can't unmask it
    if (aadhaarNumber === '************') {
      return res.json({ 
        success: false, 
        message: 'Aadhaar number is masked in database. Re-verification required.',
        masked: true
      });
    }
    
    res.json({ 
      success: true, 
      aadhaar_number: aadhaarNumber,
      masked: false
    });
    
  } catch (error) {
    console.error('Get unmasked Aadhaar error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add endpoint to update existing user's Aadhaar data
export const updateUserAadhaarData = async (req, res) => {
  try {
    const { aadhaar_data } = req.body;
    const userId = req.user.id; // Get from authenticated user
    
    if (!aadhaar_data) {
      return res.status(400).json({
        success: false,
        error: 'Aadhaar data is required'
      });
    }
    
    console.log('Updating Aadhaar data for user:', userId);
    console.log('New Aadhaar data:', aadhaar_data);
    
    // Update user with comprehensive Aadhaar data
    await db.query(`
      UPDATE users SET 
        aadhaar_number = $1,
        aadhaar_data = $2,
        aadhaar_verified = true,
        full_name = COALESCE($3, full_name),
        father_name = COALESCE($4, father_name),
        address_line1 = COALESCE($5, address_line1),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        pincode = COALESCE($8, pincode),
        gender = COALESCE($9, gender),
        date_of_birth = COALESCE($10, date_of_birth),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [
      aadhaar_data.aadhaar_number || null,
      JSON.stringify(aadhaar_data),
      aadhaar_data.full_name || aadhaar_data.name || null,
      aadhaar_data.father_name || null,
      aadhaar_data.address || null,
      aadhaar_data.city || null,
      aadhaar_data.state || null,
      aadhaar_data.pincode || null,
      aadhaar_data.gender || null,
      aadhaar_data.date_of_birth ? new Date(aadhaar_data.date_of_birth) : null,
      userId
    ]);
    
    console.log('✅ Aadhaar data updated successfully for user:', userId);
    
    res.json({
      success: true,
      message: 'Aadhaar data updated successfully'
    });
    
  } catch (error) {
    console.error('Update Aadhaar data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Aadhaar data: ' + error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      full_name,
      pan_number,
      aadhaar_number,
      pan_data,
      aadhaar_data,
      pan_verified,
      aadhaar_verified,
      date_of_birth,
      gender,
      father_name,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      country
    } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount}`, `name = $${paramCount}`);
      values.push(full_name);
      paramCount++;
    }

    if (pan_number !== undefined) {
      updates.push(`pan_number = $${paramCount}`);
      values.push(pan_number);
      paramCount++;
    }

    if (aadhaar_number !== undefined) {
      updates.push(`aadhaar_number = $${paramCount}`);
      values.push(aadhaar_number);
      paramCount++;
    }

    if (pan_data !== undefined) {
      updates.push(`pan_data = $${paramCount}`);
      values.push(typeof pan_data === 'object' ? JSON.stringify(pan_data) : pan_data);
      paramCount++;
    }

    if (aadhaar_data !== undefined) {
      updates.push(`aadhaar_data = $${paramCount}`);
      values.push(typeof aadhaar_data === 'object' ? JSON.stringify(aadhaar_data) : aadhaar_data);
      paramCount++;
    }

    if (pan_verified !== undefined) {
      updates.push(`pan_verified = $${paramCount}`);
      values.push(pan_verified);
      paramCount++;
    }

    if (aadhaar_verified !== undefined) {
      updates.push(`aadhaar_verified = $${paramCount}`);
      values.push(aadhaar_verified);
      paramCount++;
    }

    if (date_of_birth !== undefined) {
      updates.push(`date_of_birth = $${paramCount}`);
      values.push(date_of_birth);
      paramCount++;
    }

    if (gender !== undefined) {
      updates.push(`gender = $${paramCount}`);
      values.push(gender);
      paramCount++;
    }

    if (father_name !== undefined) {
      updates.push(`father_name = $${paramCount}`);
      values.push(father_name);
      paramCount++;
    }

    if (address_line1 !== undefined) {
      updates.push(`address_line1 = $${paramCount}`);
      values.push(address_line1);
      paramCount++;
    }

    if (address_line2 !== undefined) {
      updates.push(`address_line2 = $${paramCount}`);
      values.push(address_line2);
      paramCount++;
    }

    if (city !== undefined) {
      updates.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }

    if (state !== undefined) {
      updates.push(`state = $${paramCount}`);
      values.push(state);
      paramCount++;
    }

    if (pincode !== undefined) {
      updates.push(`pincode = $${paramCount}`);
      values.push(pincode);
      paramCount++;
    }

    if (country !== undefined) {
      updates.push(`country = $${paramCount}`);
      values.push(country);
      paramCount++;
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    // Check if KYC is completed
    if (pan_verified && aadhaar_verified) {
      updates.push(`kyc_completed = $${paramCount}`);
      values.push(true);
      paramCount++;
    }

    if (updates.length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add user ID as the last parameter
    values.push(req.user.id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`;
    
    await db.query(query, values);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};
export const getProfile = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.user_id, u.name, u.full_name, u.role, u.phone, u.status, 
        u.reporting_to, u.branch_id, u.refer_code, u.joining_date,
        u.pan_number, u.aadhaar_number, u.pan_data, u.aadhaar_data, 
        u.pan_verified, u.aadhaar_verified, u.kyc_completed,
        u.date_of_birth, u.gender, u.father_name, 
        u.address_line1, u.address_line2, u.city, u.state, u.pincode, u.country,
        u.photo_path, u.created_at, u.updated_at,
        b.name as branch_name,
        m.name as manager_name, m.full_name as manager_full_name, m.role as manager_role
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN users m ON u.reporting_to = m.id
      WHERE u.id = $1
    `, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Parse JSON data
    let panData = null;
    let aadhaarData = null;
    
    try {
      panData = user.pan_data ? (typeof user.pan_data === 'object' ? user.pan_data : JSON.parse(user.pan_data)) : null;
    } catch (e) {
      console.error('Error parsing PAN data:', e);
    }
    
    try {
      aadhaarData = user.aadhaar_data ? (typeof user.aadhaar_data === 'object' ? user.aadhaar_data : JSON.parse(user.aadhaar_data)) : null;
    } catch (e) {
      console.error('Error parsing Aadhaar data:', e);
    }
    
    // Enhanced Aadhaar data processing
    let processedAadhaarData = null;
    if (aadhaarData) {
      processedAadhaarData = {
        ...aadhaarData,
        // Add address from various possible sources
        address: aadhaarData.address || 
                aadhaarData.care_of || 
                aadhaarData.house || 
                aadhaarData.street || 
                aadhaarData.landmark || 
                aadhaarData.locality || 
                aadhaarData.vtc || 
                aadhaarData.subdist || 
                aadhaarData.dist || 
                aadhaarData.state || 
                null,
        // Extract location details
        city: aadhaarData.city || aadhaarData.vtc || aadhaarData.dist || null,
        state: aadhaarData.state || null,
        pincode: aadhaarData.pincode || aadhaarData.pin_code || null,
        // Handle different date formats
        date_of_birth: aadhaarData.date_of_birth || aadhaarData.dob || null,
        // Handle name variations
        full_name: aadhaarData.full_name || aadhaarData.name || null,
        name: aadhaarData.name || aadhaarData.full_name || null,
        // Handle father name
        father_name: aadhaarData.father_name || aadhaarData.care_of || null
      };
    }
    
    res.json({
      id: user.id,
      user_id: user.user_id,
      name: user.name || user.full_name,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      reporting_to: user.reporting_to,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
      refer_code: user.refer_code,
      joining_date: user.joining_date,
      manager_name: user.manager_name || user.manager_full_name,
      manager_role: user.manager_role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      
      // KYC Information
      kyc: {
        pan_number: user.pan_number,
        aadhaar_number: user.aadhaar_number,
        pan_verified: user.pan_verified,
        aadhaar_verified: user.aadhaar_verified,
        kyc_completed: user.kyc_completed,
        
        // Personal Details - prioritize from KYC data, fallback to user table
        date_of_birth: panData?.dob || processedAadhaarData?.date_of_birth || user.date_of_birth,
        gender: panData?.gender || processedAadhaarData?.gender || user.gender,
        father_name: processedAadhaarData?.father_name || user.father_name,
        
        // Address Details - prioritize structured address, fallback to Aadhaar
        address: {
          line1: user.address_line1 || processedAadhaarData?.address,
          line2: user.address_line2,
          city: user.city || processedAadhaarData?.city,
          state: user.state || processedAadhaarData?.state,
          pincode: user.pincode || processedAadhaarData?.pincode,
          country: user.country
        },
        
        // Enhanced location details
        city: user.city || processedAadhaarData?.city,
        state: user.state || processedAadhaarData?.state,
        pincode: user.pincode || processedAadhaarData?.pincode,
        
        // Raw KYC Data
        pan_details: panData,
        aadhaar_details: processedAadhaarData
      },
      photo_path: user.photo_path || null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};
