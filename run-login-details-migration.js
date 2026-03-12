import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://Board:Sanam%4028@72.61.238.231:3000/board',
  ssl: false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting login details migration...');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migration_add_login_details.sql'),
      'utf8'
    );
    
    // Execute the migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Added fields:');
    console.log('   - selected_financier (VARCHAR 255)');
    console.log('   - financier_location (VARCHAR 255)');
    console.log('   - sales_manager (VARCHAR 255)');
    console.log('   - current_landmark (VARCHAR 255)');
    console.log('   - current_state (VARCHAR 100)');
    console.log('   - permanent_state (VARCHAR 100)');
    console.log('   - engine_number (VARCHAR 100)');
    console.log('   - chassis_number (VARCHAR 100)');
    console.log('   - owner_name (VARCHAR 255)');
    console.log('   - maker_model (VARCHAR 100)');
    console.log('   - fuel_type (VARCHAR 50)');
    console.log('   - manufacturing_date (DATE)');
    console.log('   - ownership_type (VARCHAR 50)');
    console.log('   - financer (VARCHAR 255)');
    console.log('   - finance_status (VARCHAR 50)');
    console.log('   - insurance_company (VARCHAR 255)');
    console.log('   - insurance_valid_upto (DATE)');
    console.log('   - pucc_valid_upto (DATE)');
    console.log('   - financier_name (VARCHAR 255)');
    console.log('   - maker_description (VARCHAR 255)');
    console.log('📊 Created indexes for better performance');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
