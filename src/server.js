import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import applicationStageRoutes from './routes/applicationStages.js';
import whatsappRoutes from './routes/whatsapp.js';
import kycRoutes from './routes/kyc.js';
import { logger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import applicationStageJobs from './utils/applicationStageJobs.js';
import simpleScheduler from './utils/simpleScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(logger);

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/brokers', brokerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/field-permissions', fieldPermissionRoutes);

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
    console.log('✅ bank_branches table ready');
  } catch (err) {
    console.error('❌ bank_branches table init failed:', err.message);
  }

  // Add branch/SM/AM columns to loans table if not exists
  const newCols = [
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_branch_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_executive_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_executive_mobile VARCHAR(20)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_area_manager_name VARCHAR(255)',
    'ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_area_manager_mobile VARCHAR(20)',
  ];
  for (const sql of newCols) {
    try {
      await db.query(sql);
    } catch (err) {
      console.error('❌ Column migration failed:', err.message);
    }
  }
  console.log('✅ loans branch/SM/AM columns ready');
  
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
