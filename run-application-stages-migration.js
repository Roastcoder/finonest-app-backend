import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

// Database configuration using the provided connection string
const pool = new Pool({
  connectionString: 'postgres://Board:Sanam%4028@72.61.238.231:3000/board'
});

async function runApplicationStagesMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running Application Stages Migration...');
    
    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync('./migration_application_stages.sql', 'utf8');
    await client.query(migrationSQL);
    
    console.log('✅ Application stages migration completed successfully!');
    console.log('📋 Added fields:');
    console.log('   - application_stage (default: submitted)');
    console.log('   - app_score, credit_score');
    console.log('   - tags (array)');
    console.log('   - roi, loan_account_number');
    console.log('   - rc_type, rc_collected_by');
    console.log('   - rto_agent_name_rc, rto_agent_mobile');
    console.log('   - banker_name, banker_mobile');
    console.log('   - rejection_remarks, approval_remarks, cancellation_remarks');
    console.log('   - approved_at, stage_changed_at');
    console.log('📊 Created application_stage_history table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.log('ℹ️  Tables already exist - migration may have been run before');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runApplicationStagesMigration();