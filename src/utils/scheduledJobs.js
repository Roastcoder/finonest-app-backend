import cron from 'node-cron';
import leadStatusLogic from '../utils/leadStatusLogic.js';

// Run auto-cancellation every day at midnight
const scheduleAutoCancellation = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running auto-cancellation job...');
    
    try {
      const results = await leadStatusLogic.autoCancelExpiredApprovals();
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      console.log(`Auto-cancellation completed: ${successCount} successful, ${failureCount} failed`);
      
      if (failureCount > 0) {
        console.error('Failed auto-cancellations:', results.filter(r => !r.success));
      }
    } catch (error) {
      console.error('Auto-cancellation job failed:', error);
    }
  });
  
  console.log('Auto-cancellation job scheduled to run daily at midnight');
};

// Run status cleanup - remove old audit logs, notifications etc.
const scheduleStatusCleanup = () => {
  cron.schedule('0 2 * * 0', async () => {
    console.log('Running weekly status cleanup...');
    
    try {
      // Clean up old audit logs (older than 90 days)
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - 90);
      
      // This would be implemented based on your cleanup requirements
      console.log('Status cleanup completed');
    } catch (error) {
      console.error('Status cleanup failed:', error);
    }
  });
  
  console.log('Status cleanup job scheduled to run weekly on Sunday at 2 AM');
};

// Initialize all scheduled jobs
export const initializeScheduledJobs = () => {
  scheduleAutoCancellation();
  scheduleStatusCleanup();
};

export default {
  initializeScheduledJobs,
  scheduleAutoCancellation,
  scheduleStatusCleanup
};