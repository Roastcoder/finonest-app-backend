import cron from 'node-cron';
import applicationStageLogic from '../utils/applicationStageLogic.js';
import db from '../config/database.js';

// Create scheduled jobs table if it doesn't exist
const createScheduledJobsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id SERIAL PRIMARY KEY,
        job_type VARCHAR(50) NOT NULL,
        reference_id INT NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP,
        error_message TEXT
      )
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_type_status 
      ON scheduled_jobs(job_type, status)
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_scheduled_date 
      ON scheduled_jobs(scheduled_date)
    `);
    
    console.log('Scheduled jobs table initialized');
  } catch (error) {
    console.error('Error creating scheduled jobs table:', error);
  }
};

// Run auto-cancellation for approved leads (30 days)
const runAutoCancellationJob = async () => {
  console.log('Running auto-cancellation job for approved leads...');
  
  try {
    const results = await applicationStageLogic.autoCancelExpiredApprovals();
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Auto-cancellation completed: ${successCount} successful, ${failureCount} failed`);
    
    if (failureCount > 0) {
      console.error('Failed auto-cancellations:', results.filter(r => !r.success));
    }
    
    // Update scheduled jobs status
    await db.query(`
      UPDATE scheduled_jobs 
      SET status = 'COMPLETED', executed_at = NOW() 
      WHERE job_type = 'AUTO_CANCEL_APPROVAL' 
      AND status = 'PENDING' 
      AND scheduled_date <= NOW()
    `);
    
  } catch (error) {
    console.error('Auto-cancellation job failed:', error);
    
    // Mark failed jobs
    await db.query(`
      UPDATE scheduled_jobs 
      SET status = 'FAILED', executed_at = NOW(), error_message = $1
      WHERE job_type = 'AUTO_CANCEL_APPROVAL' 
      AND status = 'PENDING' 
      AND scheduled_date <= NOW()
    `, [error.message]);
  }
};

// Send stage transition notifications
const sendStageNotifications = async () => {
  console.log('Sending stage transition notifications...');
  
  try {
    // Get leads that need notifications (e.g., approved leads nearing 30-day limit)
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() - 25); // 5 days before auto-cancellation
    
    const result = await db.query(`
      SELECT l.id, l.customer_name, l.stage_data, u.email, u.full_name
      FROM leads l
      JOIN users u ON l.assigned_to = u.id
      WHERE l.application_stage = $1
      AND (l.stage_data->>'approvedData'->>'approvedDate')::timestamp < $2
      AND (l.stage_data->>'approvedData'->>'approvedDate')::timestamp > $3
    `, [
      applicationStageLogic.APPLICATION_STAGES.APPROVED,
      new Date().toISOString(),
      warningDate.toISOString()
    ]);
    
    for (const lead of result.rows) {
      // Create notification
      await db.query(`
        INSERT INTO notifications (
          user_id, notification_type, title, message, 
          related_id, related_type
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        lead.assigned_to,
        'STAGE_WARNING',
        'Lead Approval Expiring Soon',
        `Lead for ${lead.customer_name} will be auto-cancelled in 5 days if not disbursed`,
        lead.id,
        'lead'
      ]);
    }
    
    console.log(`Sent ${result.rows.length} stage notification warnings`);
    
  } catch (error) {
    console.error('Stage notifications job failed:', error);
  }
};

// Clean up old stage history data
const cleanupStageHistory = async () => {
  console.log('Running stage history cleanup...');
  
  try {
    // Clean up old audit logs (older than 90 days)
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 90);
    
    const result = await db.query(`
      DELETE FROM audit_logs 
      WHERE action = 'UPDATE_APPLICATION_STAGE' 
      AND created_at < $1
    `, [cleanupDate]);
    
    console.log(`Cleaned up ${result.rowCount} old stage audit logs`);
    
    // Clean up completed scheduled jobs (older than 30 days)
    const jobCleanupDate = new Date();
    jobCleanupDate.setDate(jobCleanupDate.getDate() - 30);
    
    const jobResult = await db.query(`
      DELETE FROM scheduled_jobs 
      WHERE status IN ('COMPLETED', 'FAILED') 
      AND executed_at < $1
    `, [jobCleanupDate]);
    
    console.log(`Cleaned up ${jobResult.rowCount} old scheduled jobs`);
    
  } catch (error) {
    console.error('Stage history cleanup failed:', error);
  }
};

// Generate stage analytics reports
const generateStageAnalytics = async () => {
  console.log('Generating stage analytics...');
  
  try {
    const analytics = await applicationStageLogic.getStageFlowAnalytics({
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      dateTo: new Date()
    });
    
    // Store analytics in a reports table or send to external system
    console.log('Stage analytics generated:', analytics);
    
  } catch (error) {
    console.error('Stage analytics generation failed:', error);
  }
};

// Schedule all application stage jobs
const scheduleApplicationStageJobs = () => {
  // Run auto-cancellation every day at 1 AM
  cron.schedule('0 1 * * *', runAutoCancellationJob);
  console.log('Auto-cancellation job scheduled to run daily at 1 AM');
  
  // Send stage notifications every day at 9 AM
  cron.schedule('0 9 * * *', sendStageNotifications);
  console.log('Stage notifications job scheduled to run daily at 9 AM');
  
  // Clean up old data every Sunday at 2 AM
  cron.schedule('0 2 * * 0', cleanupStageHistory);
  console.log('Stage history cleanup job scheduled to run weekly on Sunday at 2 AM');
  
  // Generate analytics every day at 11 PM
  cron.schedule('0 23 * * *', generateStageAnalytics);
  console.log('Stage analytics job scheduled to run daily at 11 PM');
};

// Process pending scheduled jobs (run every hour)
const processPendingJobs = async () => {
  try {
    const result = await db.query(`
      SELECT * FROM scheduled_jobs 
      WHERE status = 'PENDING' 
      AND scheduled_date <= NOW()
      ORDER BY scheduled_date ASC
    `);
    
    for (const job of result.rows) {
      try {
        const metadata = job.metadata ? JSON.parse(job.metadata) : {};
        const tableType = metadata.tableType || 'leads';
        
        switch (job.job_type) {
          case 'AUTO_LOGIN_TRANSITION':
            // Auto-transition from SUBMITTED to LOGIN after 24 hours
            if (tableType === 'leads') {
              await applicationStageLogic.updateLeadApplicationStage(
                job.reference_id,
                applicationStageLogic.APPLICATION_STAGES.LOGIN,
                {
                  remarks: 'Auto-transitioned to LOGIN stage after 24 hours'
                },
                'SYSTEM'
              );
            } else {
              await applicationStageLogic.updateLoanApplicationStage(
                job.reference_id,
                applicationStageLogic.APPLICATION_STAGES.LOGIN,
                {
                  remarks: 'Auto-transitioned to LOGIN stage after 24 hours'
                },
                'SYSTEM'
              );
            }
            
            await db.query(`
              UPDATE scheduled_jobs 
              SET status = 'COMPLETED', executed_at = NOW() 
              WHERE id = $1
            `, [job.id]);
            
            console.log(`Executed auto-login transition for ${tableType} ${job.reference_id}`);
            break;
            
          case 'AUTO_CANCEL_APPROVAL':
            if (tableType === 'leads') {
              await applicationStageLogic.updateLeadApplicationStage(
                job.reference_id,
                applicationStageLogic.APPLICATION_STAGES.CANCELLED,
                {
                  remarks: 'Auto-cancelled: Not disbursed within 30 days of approval'
                },
                'SYSTEM'
              );
            } else {
              await applicationStageLogic.updateLoanApplicationStage(
                job.reference_id,
                applicationStageLogic.APPLICATION_STAGES.CANCELLED,
                {
                  remarks: 'Auto-cancelled: Not disbursed within 30 days of approval'
                },
                'SYSTEM'
              );
            }
            
            await db.query(`
              UPDATE scheduled_jobs 
              SET status = 'COMPLETED', executed_at = NOW() 
              WHERE id = $1
            `, [job.id]);
            
            console.log(`Executed auto-cancellation for ${tableType} ${job.reference_id}`);
            break;
            
          default:
            console.log(`Unknown job type: ${job.job_type}`);
        }
      } catch (error) {
        console.error(`Failed to execute job ${job.id}:`, error);
        
        await db.query(`
          UPDATE scheduled_jobs 
          SET status = 'FAILED', executed_at = NOW(), error_message = $1 
          WHERE id = $2
        `, [error.message, job.id]);
      }
    }
  } catch (error) {
    console.error('Error processing pending jobs:', error);
  }
};

// Initialize all scheduled jobs
export const initializeApplicationStageJobs = async () => {
  await createScheduledJobsTable();
  scheduleApplicationStageJobs();
  
  // Process pending jobs every hour
  cron.schedule('0 * * * *', processPendingJobs);
  console.log('Pending jobs processor scheduled to run every hour');
};

// Manual job triggers (for testing or admin use)
export const manualJobTriggers = {
  runAutoCancellation: runAutoCancellationJob,
  sendNotifications: sendStageNotifications,
  cleanupHistory: cleanupStageHistory,
  generateAnalytics: generateStageAnalytics,
  processPendingJobs
};

export default {
  initializeApplicationStageJobs,
  manualJobTriggers
};