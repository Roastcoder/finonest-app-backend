import applicationStageLogic from '../utils/applicationStageLogic.js';
import db from '../config/database.js';

// Simple interval-based scheduler (alternative to node-cron)
class SimpleScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Add a job with interval in milliseconds
  addJob(name, intervalMs, jobFunction) {
    if (this.jobs.has(name)) {
      clearInterval(this.jobs.get(name));
    }
    
    const intervalId = setInterval(async () => {
      try {
        console.log(`Running scheduled job: ${name}`);
        await jobFunction();
      } catch (error) {
        console.error(`Scheduled job ${name} failed:`, error);
      }
    }, intervalMs);
    
    this.jobs.set(name, intervalId);
    console.log(`Scheduled job '${name}' added with interval ${intervalMs}ms`);
  }

  // Remove a job
  removeJob(name) {
    if (this.jobs.has(name)) {
      clearInterval(this.jobs.get(name));
      this.jobs.delete(name);
      console.log(`Scheduled job '${name}' removed`);
    }
  }

  // Stop all jobs
  stopAll() {
    for (const [name, intervalId] of this.jobs) {
      clearInterval(intervalId);
      console.log(`Stopped job: ${name}`);
    }
    this.jobs.clear();
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    console.log('Simple scheduler started');
  }
}

const scheduler = new SimpleScheduler();

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
    
    console.log('Scheduled jobs table initialized');
  } catch (error) {
    console.error('Error creating scheduled jobs table:', error);
  }
};

// Auto-cancellation job
const runAutoCancellationJob = async () => {
  try {
    const results = await applicationStageLogic.autoCancelExpiredApprovals();
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`Auto-cancellation completed: ${successCount} successful, ${failureCount} failed`);
    
    if (failureCount > 0) {
      console.error('Failed auto-cancellations:', results.filter(r => !r.success));
    }
  } catch (error) {
    console.error('Auto-cancellation job failed:', error);
  }
};

// Send notifications job
const sendStageNotifications = async () => {
  try {
    // Get leads that need notifications (5 days before auto-cancellation)
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() - 25);
    
    const result = await db.query(`
      SELECT l.id, l.customer_name, l.stage_data, l.assigned_to, u.email, u.full_name
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
      ]).catch(() => {
        // If notifications table doesn't exist, just log
        console.log(`Notification: Lead ${lead.id} for ${lead.customer_name} expiring soon`);
      });
    }
    
    console.log(`Sent ${result.rows.length} stage notification warnings`);
  } catch (error) {
    console.error('Stage notifications job failed:', error);
  }
};

// Cleanup old data
const cleanupOldData = async () => {
  try {
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 90);
    
    // Clean up old audit logs
    const auditResult = await db.query(`
      DELETE FROM audit_logs 
      WHERE action = 'UPDATE_APPLICATION_STAGE' 
      AND created_at < $1
    `, [cleanupDate]).catch(() => ({ rowCount: 0 }));
    
    console.log(`Cleaned up ${auditResult.rowCount} old stage audit logs`);
    
    // Clean up old scheduled jobs
    const jobCleanupDate = new Date();
    jobCleanupDate.setDate(jobCleanupDate.getDate() - 30);
    
    const jobResult = await db.query(`
      DELETE FROM scheduled_jobs 
      WHERE status IN ('COMPLETED', 'FAILED') 
      AND executed_at < $1
    `, [jobCleanupDate]).catch(() => ({ rowCount: 0 }));
    
    console.log(`Cleaned up ${jobResult.rowCount} old scheduled jobs`);
  } catch (error) {
    console.error('Cleanup job failed:', error);
  }
};

// Initialize simple scheduler
export const initializeSimpleScheduler = async () => {
  await createScheduledJobsTable();
  
  scheduler.start();
  
  // Add jobs with intervals
  // Auto-cancellation every 24 hours (86400000 ms)
  scheduler.addJob('auto-cancellation', 24 * 60 * 60 * 1000, runAutoCancellationJob);
  
  // Notifications every 12 hours (43200000 ms)
  scheduler.addJob('stage-notifications', 12 * 60 * 60 * 1000, sendStageNotifications);
  
  // Cleanup every 7 days (604800000 ms)
  scheduler.addJob('data-cleanup', 7 * 24 * 60 * 60 * 1000, cleanupOldData);
  
  console.log('✅ Simple scheduler initialized with application stage jobs');
};

// Manual job triggers
export const manualJobTriggers = {
  runAutoCancellation: runAutoCancellationJob,
  sendNotifications: sendStageNotifications,
  cleanupData: cleanupOldData
};

// Stop scheduler (for graceful shutdown)
export const stopScheduler = () => {
  scheduler.stopAll();
};

export default {
  initializeSimpleScheduler,
  manualJobTriggers,
  stopScheduler
};