import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import db from './config/database.js';
import authRoutes from './routes/auth.js';
import loanRoutes from './routes/loans.js';
import bankRoutes from './routes/banks.js';
import brokerRoutes from './routes/brokers.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import leadRoutes from './routes/leads.js';
import commissionRoutes from './routes/commissions.js';
import reportRoutes from './routes/reports.js';
import branchRoutes from './routes/branches.js';
import expenseRoutes from './routes/expenses.js';
import payoutRoutes from './routes/payouts.js';
import rcLimitRoutes from './routes/rcLimits.js';
import insuranceRoutes from './routes/insurance.js';
import auditLogRoutes from './routes/auditLogs.js';
import notificationRoutes from './routes/notifications.js';
import configRoutes from './routes/config.js';
import documentRoutes from './routes/documents.js';
import financierRoutes from './routes/financiers.js';
import customerPortalRoutes from './routes/customerPortal.js';
import rcVerificationRoutes from './routes/rcVerification.js';
import accountantRoutes from './routes/accountant.js';
import integrationRoutes from './routes/integrations.js';
import timelineRoutes from './routes/timeline.js';
import fieldPermissionRoutes from './routes/fieldPermissions.js';
import permissionRoutes from './routes/permissions.js';
import applicationStageRoutes from './routes/applicationStages.js';
import whatsappRoutes from './routes/whatsapp.js';
import kycRoutes from './routes/kyc.js';
import templateRoutes from './routes/templates.js';
import chatbotRoutes from './routes/chatbot.js';
import linkLoanRoutes from './routes/linkLoan.js';
import findLenderRoutes from './routes/findLender.js';
import googleMapsProxyRoutes from './routes/googleMapsProxy.js';
import loanDraftsRoutes from './routes/loanDrafts.js';
import { logger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import applicationStageJobs from './utils/applicationStageJobs.js';
import simpleScheduler from './utils/simpleScheduler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'client-user-id', 'secret-key', 'access-key']
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(logger);

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/loan-drafts', loanDraftsRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/brokers', brokerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/field-permissions', fieldPermissionRoutes);
app.use('/api/permissions', permissionRoutes);

// New PRD Modules
app.use('/api/expenses', expenseRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/rc-limits', rcLimitRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/config', configRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/financiers', financierRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/rc-verification', rcVerificationRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/application-stages', applicationStageRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/link-loan', linkLoanRoutes);
app.use('/api/find-lender', findLenderRoutes);
app.use('/api/google-maps', googleMapsProxyRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Car Credit Hub API',
    version: '1.0.0',
    status: 'running',
    author: 'Built by RoastCoder'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Create bank_branches table if not exists
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS bank_branches (
        id SERIAL PRIMARY KEY,
        bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        branch_name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        digipin VARCHAR(20),
        geo_limit VARCHAR(50),
        product VARCHAR(255),
        sales_manager_name VARCHAR(255),
        sales_manager_mobile VARCHAR(20),
        area_sales_manager_name VARCHAR(255),
        area_sales_manager_mobile VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ bank_branches table ready with DIGIPIN support');
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.error('❌ bank_branches table init failed:', err.message);
    }
  }

  // Create loan_drafts table if not exists
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS loan_drafts (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER,
        form_data JSONB NOT NULL,
        assignment_data JSONB,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ loan_drafts table ready');
    
    // Drop the unique constraint on lead_id if it exists
    try {
      await db.query(`
        ALTER TABLE loan_drafts DROP CONSTRAINT IF EXISTS loan_drafts_lead_id_key
      `);
      console.log('✅ Removed unique constraint on lead_id');
    } catch (err) {
      // Ignore if constraint doesn't exist
    }
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.error('❌ loan_drafts table init failed:', err.message);
    }
  }

  // Add DIGIPIN column if it doesn't exist
  try {
    await db.query('ALTER TABLE bank_branches ADD COLUMN IF NOT EXISTS digipin VARCHAR(20)');
    console.log('✅ DIGIPIN column added to bank_branches');
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.error('Note: DIGIPIN column migration:', err.message);
    }
  }

  // Comprehensive column migrations
  const newCols = [
    // loans
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_branch_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_executive_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_executive_mobile VARCHAR(20)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_area_manager_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_area_manager_mobile VARCHAR(20)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS mobile VARCHAR(20)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS co_applicant_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS case_type VARCHAR(50)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS sourcing_person_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS vertical VARCHAR(100)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS scheme VARCHAR(100)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS emi DECIMAL(15,2)',
    // users - KYC & profile
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(20)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS mpin VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS refer_code VARCHAR(50)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_data TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_data TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 TEXT',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100)',
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_path VARCHAR(500)',
    // banks
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)',
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS location VARCHAR(255)',
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS geo_limit VARCHAR(50)',
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS sales_manager_name VARCHAR(255)',
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS sales_manager_mobile VARCHAR(20)',
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS area_sales_manager_name VARCHAR(255)',
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS area_sales_manager_mobile VARCHAR(20)',
    'ALTER TABLE banks ADD COLUMN IF NOT EXISTS product VARCHAR(255)',
    // branches
    'ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE',
    'ALTER TABLE branches ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
  ];
  for (const sql of newCols) {
    try {
      await db.query(sql);
    } catch (err) {
      if (!err.message.includes('already exists')) {
        console.error('❌ Migration failed:', err.message);
      }
    }
  }
  console.log('✅ All column migrations applied');

  // Ensure profile-photos upload dir exists
  const { default: fs } = await import('fs');
  const { default: path } = await import('path');
  const photoDir = path.join(process.cwd(), 'uploads', 'profile-photos');
  if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
  const bankLogoDir = path.join(process.cwd(), 'uploads', 'bank-logos');
  if (!fs.existsSync(bankLogoDir)) fs.mkdirSync(bankLogoDir, { recursive: true });
  console.log('✅ profile-photos & bank-logos directories ready');
  
  // Initialize application stage jobs
  try {
    // Use simple scheduler (no external dependencies)
    await simpleScheduler.initializeSimpleScheduler();
    console.log('✅ Application stage jobs initialized with simple scheduler');
    
    // Alternative: Use node-cron based scheduler (requires node-cron package)
    // await applicationStageJobs.initializeApplicationStageJobs();
    // console.log('✅ Application stage jobs initialized with cron scheduler');
  } catch (error) {
    console.error('❌ Failed to initialize application stage jobs:', error);
  }
});
