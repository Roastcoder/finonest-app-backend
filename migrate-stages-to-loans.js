import db from './src/config/database.js';

async function migrateStagesToLoans() {
  try {
    console.log('Moving application stages from leads to loans...');
    
    // Add columns to loans table
    console.log('Adding application_stage column to loans...');
    await db.query(`
      ALTER TABLE loans 
      ADD COLUMN IF NOT EXISTS application_stage VARCHAR(20) DEFAULT 'SUBMITTED'
    `);
    
    console.log('Adding stage_data column to loans...');
    await db.query(`
      ALTER TABLE loans 
      ADD COLUMN IF NOT EXISTS stage_data JSONB
    `);
    
    console.log('Adding stage_history column to loans...');
    await db.query(`
      ALTER TABLE loans 
      ADD COLUMN IF NOT EXISTS stage_history JSONB[]
    `);
    
    // Create index
    console.log('Creating index on loans...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_loans_application_stage ON loans(application_stage)
    `);
    
    // Update existing loans
    console.log('Updating existing loans...');
    await db.query(`
      UPDATE loans 
      SET application_stage = 'SUBMITTED' 
      WHERE application_stage IS NULL
    `);
    
    // Remove columns from leads table (optional - keep for now)
    console.log('Removing application stage columns from leads...');
    await db.query(`
      ALTER TABLE leads 
      DROP COLUMN IF EXISTS application_stage,
      DROP COLUMN IF EXISTS stage_data,
      DROP COLUMN IF EXISTS stage_history
    `);
    
    // Drop index from leads
    await db.query(`
      DROP INDEX IF EXISTS idx_leads_application_stage
    `);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateStagesToLoans();