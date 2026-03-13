import fs from 'fs';
import path from 'path';
import db from './src/config/database.js';

async function runLeadApplicationStagesMigration() {
  try {
    console.log('Running lead application stages migration...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'add_lead_application_stages.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    await db.query(sql);
    
    console.log('✓ Lead application stages migration completed successfully!');
    
    // Test the migration by checking the table structure
    const columnsResult = await db.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name IN ('application_stage', 'stage_data', 'stage_history')
      ORDER BY column_name
    `);
    
    console.log('Added columns:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'})`);
    });
    
    // Check how many leads were updated
    const countResult = await db.query(`
      SELECT COUNT(*) as total_leads,
             COUNT(CASE WHEN application_stage = 'SUBMITTED' THEN 1 END) as submitted_leads
      FROM leads
    `);
    
    console.log(`Total leads: ${countResult.rows[0].total_leads}`);
    console.log(`Leads with SUBMITTED stage: ${countResult.rows[0].submitted_leads}`);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

runLeadApplicationStagesMigration();