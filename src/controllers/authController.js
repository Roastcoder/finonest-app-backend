import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import https from 'https';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// In-memory stores
const mobileOtpStore = new Map();
const aadhaarOtpStore = new Map();
const signupSessions = new Map();

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

// Step 1: Check PAN
export const step1CheckPan = async (req, res) => {
  try {
    const { pan_number, pan_data, refer_code, role = 'executive' } = req.body;
    
    if (!pan_number || pan_number.length !== 10) {
      return res.status(400).json({ success: false, error: 'Invalid PAN number format' });
    }
    
    const existingPan = await db.query('SELECT id, name, full_name FROM users WHERE pan_number = $1', [pan_number]);
    if (existingPan.rows.length > 0) {
      const existingUserName = existingPan.rows[0].name || existingPan.rows[0].full_name;
      return res.status(400).json({ 
        success: false,
        error: `This PAN number is already registered with ${existingUserName}. Please use a different PAN number or contact support.`,
        errorType: 'PAN_EXISTS'
      });
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    signupSessions.set(sessionId, {
      step: 1,
      pan_number,
      pan_data: pan_data || null,
      refer_code: refer_code || null,
      role: role
    });
    
    res.json({
      success: true,
      message: 'PAN verified successfully',
      sessionId,
      nextStep: 2
    });
  } catch (error) {
    console.error('Step 1 error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify PAN' });
  }
};

// Step 2: Send Mobile OTP
export const step2SendMobileOtp = async (req, res) => {
  try {
    const { phone, sessionId } = req.body;
    
    if (!sessionId || !signupSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session' });
    }
    
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid mobile number' });
    }
    
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    mobileOtpStore.set(phone, { otp, expiresAt: Date.now() + 3 * 60 * 1000 });
    await sendSarvSms(phone, otp);
    
    const session = signupSessions.get(sessionId);
    session.step = 2;
    session.phone = phone;
    
    res.json({ success: true, message: 'OTP sent successfully', nextStep: 3 });
  } catch (error) {
    console.error('Step 2 error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
};

// Step 3: Verify Mobile OTP
export const step3VerifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp, sessionId } = req.body;
    
    if (!sessionId || !signupSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session' });
    }
    
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
    const session = signupSessions.get(sessionId);
    session.step = 3;
    session.mobile_verified = true;
    
    res.json({ success: true, message: 'Mobile number verified successfully', nextStep: 4 });
  } catch (error) {
    console.error('Step 3 error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

// Step 4: Email + Password
export const step4EmailPassword = async (req, res) => {
  try {
    const { email, password, sessionId } = req.body;
    
    if (!sessionId || !signupSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session' });
    }
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    
    const session = signupSessions.get(sessionId);
    session.step = 4;
    session.email = email;
    session.password = password;
    
    res.json({ success: true, message: 'Email and password saved', nextStep: 5 });
  } catch (error) {
    console.error('Step 4 error:', error);
    res.status(500).json({ success: false, error: 'Failed to save email and password' });
  }
};

// Step 5: Send Aadhaar OTP
export const step5SendAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar_number, sessionId } = req.body;
    
    if (!sessionId || !signupSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session' });
    }
    
    if (!aadhaar_number || aadhaar_number.length !== 12) {
      return res.status(400).json({ success: false, error: 'Invalid Aadhaar number format' });
    }
    
    const existingAadhaar = await db.query('SELECT id, name, full_name FROM users WHERE aadhaar_number = $1', [aadhaar_number]);
    if (existingAadhaar.rows.length > 0) {
      const existingUserName = existingAadhaar.rows[0].name || existingAadhaar.rows[0].full_name;
      return res.status(400).json({ 
        success: false,
        error: `This Aadhaar number is already registered with ${existingUserName}. Please use a different Aadhaar number or contact support.`,
        errorType: 'AADHAAR_EXISTS'
      });
    }
    
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    aadhaarOtpStore.set(aadhaar_number, { otp, expiresAt: Date.now() + 3 * 60 * 1000 });
    await sendSarvSms(aadhaar_number.slice(-10), otp);
    
    const session = signupSessions.get(sessionId);
    session.step = 5;
    session.aadhaar_number = aadhaar_number;
    
    res.json({ success: true, message: 'OTP sent successfully', nextStep: 6 });
  } catch (error) {
    console.error('Step 5 error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
};

// Step 6: Verify Aadhaar OTP
export const step6VerifyAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar_number, otp, aadhaar_data, sessionId } = req.body;
    
    if (!sessionId || !signupSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session' });
    }
    
    if (!aadhaar_number || !otp) {
      return res.status(400).json({ success: false, error: 'Aadhaar number and OTP are required' });
    }
    
    const record = aadhaarOtpStore.get(aadhaar_number);
    if (!record) {
      return res.status(400).json({ success: false, error: 'OTP not found. Please request a new OTP.' });
    }
    if (Date.now() > record.expiresAt) {
      aadhaarOtpStore.delete(aadhaar_number);
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new OTP.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
    }
    
    aadhaarOtpStore.delete(aadhaar_number);
    const session = signupSessions.get(sessionId);
    session.step = 6;
    session.aadhaar_verified = true;
    session.aadhaar_data = aadhaar_data || null;
    
    res.json({ success: true, message: 'Aadhaar verified successfully', nextStep: 7 });
  } catch (error) {
    console.error('Step 6 error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

// Step 7: Upload Photo
export const step7UploadPhoto = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId || !signupSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No photo uploaded' });
    }
    
    const relativePath = `uploads/profile-photos/${req.file.filename}`;
    const session = signupSessions.get(sessionId);
    session.step = 7;
    session.photo_path = relativePath;
    
    res.json({ success: true, message: 'Photo uploaded successfully', nextStep: 8 });
  } catch (error) {
    console.error('Step 7 error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload photo' });
  }
};

// Step 8: Complete Profile
export const step8CompleteProfile = async (req, res) => {
  try {
    const { name, sessionId } = req.body;
    
    if (!sessionId || !signupSessions.has(sessionId)) {
      return res.status(400).json({ success: false, error: 'Invalid session' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    const session = signupSessions.get(sessionId);
    const hashedPassword = await bcrypt.hash(session.password, 10);
    
    // Determine status based on refer code
    let finalStatus = 'pending';
    let reportingTo = null;
    
    if (session.role === 'executive' && session.refer_code) {
      const referrerResult = await db.query(
        `SELECT id FROM users WHERE refer_code = $1 AND role = ANY($2)`,
        [session.refer_code, ['branch_manager', 'dsa', 'sales_manager', 'team_leader']]
      );
      
      if (referrerResult.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid refer code' });
      }
      
      finalStatus = 'active';
      reportingTo = referrerResult.rows[0].id;
    }
    
    if (['admin', 'sales_manager'].includes(session.role)) {
      finalStatus = 'active';
    }
    
    // Generate user ID
    const seqResult = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM 'FN(\\d+)') AS INTEGER)), 0) + 1 as next_seq
       FROM users WHERE user_id LIKE 'FN%'`
    );
    const sequence = String(seqResult.rows[0].next_seq).padStart(5, '0');
    const userId = `FN${sequence}`;
    
    // Create user
    const result = await db.query(
      `INSERT INTO users (
        user_id, name, full_name, email, password, phone, role, status, reporting_to,
        pan_number, aadhaar_number, pan_data, aadhaar_data, pan_verified, aadhaar_verified,
        photo_path, kyc_completed, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING id, user_id, email, role, status`,
      [
        userId, name, name, session.email, hashedPassword, session.phone, session.role, finalStatus, reportingTo,
        session.pan_number, session.aadhaar_number,
        session.pan_data ? JSON.stringify(session.pan_data) : null,
        session.aadhaar_data ? JSON.stringify(session.aadhaar_data) : null,
        !!session.pan_data, !!session.aadhaar_data,
        session.photo_path || null, !!(session.pan_data && session.aadhaar_data),
        new Date(), new Date()
      ]
    );
    
    signupSessions.delete(sessionId);
    const user = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: finalStatus === 'active' ? 'Account created successfully!' : 'Account created. Awaiting approval.',
      user: {
        id: user.id,
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Step 8 error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete profile' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query(`
      SELECT u.*, m.name as manager_name, m.full_name as manager_full_name, m.role as manager_role
      FROM users u
      LEFT JOIN users m ON u.reporting_to = m.id
      WHERE u.email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Account Pending For Verification. Retry Login After 5 Mins.',
        status: user.status 
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Your account has been suspended. Please contact admin.',
        status: user.status 
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ 
        error: 'Your account is inactive. Please contact admin.',
        status: user.status 
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name || user.full_name, 
        email: user.email, 
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
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.user_id, u.name, u.full_name, u.email, u.role, u.phone, u.status, 
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
    
    let panData = null;
    let aadhaarData = null;
    
    try {
      panData = user.pan_data ? JSON.parse(user.pan_data) : null;
    } catch (e) {
      console.error('Error parsing PAN data:', e);
    }
    
    try {
      aadhaarData = user.aadhaar_data ? JSON.parse(user.aadhaar_data) : null;
    } catch (e) {
      console.error('Error parsing Aadhaar data:', e);
    }
    
    res.json({
      id: user.id,
      user_id: user.user_id,
      name: user.name || user.full_name,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
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
      
      kyc: {
        pan_number: user.pan_number,
        aadhaar_number: user.aadhaar_number,
        pan_verified: user.pan_verified,
        aadhaar_verified: user.aadhaar_verified,
        kyc_completed: user.kyc_completed,
        
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        father_name: user.father_name,
        
        address: {
          line1: user.address_line1,
          line2: user.address_line2,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          country: user.country
        },
        
        pan_details: panData,
        aadhaar_details: aadhaarData
      },
      photo_path: user.photo_path || null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};
