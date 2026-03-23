import db from './src/config/database.js';

async function addKycColumns() {
  try {
    console.log('Adding KYC data columns to users table...');
    
    const kycColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_data JSONB',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_data JSONB',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'INDIA'"
    ];
    
    for (const query of kycColumns) {
      try {
        await db.query(query);
        const columnName = query.split('ADD COLUMN IF NOT EXISTS ')[1]?.split(' ')[0] || 'Column';
        console.log('✅', columnName, 'added');
      } catch (error) {
        console.log('⚠️ Error with query:', error.message);
      }
    }
    
    console.log('\n✅ All KYC columns processed!');
    
    // Check final table structure
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND (
        column_name LIKE '%pan%' OR 
        column_name LIKE '%aadhaar%' OR 
        column_name LIKE '%kyc%' OR
        column_name IN ('date_of_birth', 'gender', 'father_name', 'address_line1', 'address_line2', 'city', 'state', 'pincode', 'country')
      )
      ORDER BY column_name
    `);
    
    console.log('\nKYC-related columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error adding KYC columns:', error.message);
  }
}

addKycColumns();