import db from './src/config/database.js';

async function runMigration() {
  try {
    console.log('Running database migration for application stages...');
    
    // Add columns
    console.log('Adding application_stage column...');
    await db.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS application_stage VARCHAR(20) DEFAULT 'SUBMITTED'
    `);
    
    console.log('Adding stage_data column...');
    await db.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS stage_data JSONB
    `);
    
    console.log('Adding stage_history column...');
    await db.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS stage_history JSONB[]
    `);
    
    // Create index
    console.log('Creating index...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_application_stage ON leads(application_stage)
    `);
    
    // Update existing leads
    console.log('Updating existing leads...');
    await db.query(`
      UPDATE leads 
      SET application_stage = 'SUBMITTED' 
      WHERE application_stage IS NULL
    `);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();