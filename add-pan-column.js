import db from './src/config/database.js';

async function checkAndAddPanColumn() {
  try {
    console.log('Checking users table structure...\n');
    
    // Check current columns
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if pan_number column exists
    const panColumnExists = columns.rows.some(col => col.column_name === 'pan_number');
    
    if (!panColumnExists) {
      console.log('\nAdding pan_number column...');
      await db.query('ALTER TABLE users ADD COLUMN pan_number VARCHAR(10)');
      console.log('✅ pan_number column added successfully');
    } else {
      console.log('\n✅ pan_number column already exists');
    }
    
    // Also check for aadhaar_number column
    const aadhaarColumnExists = columns.rows.some(col => col.column_name === 'aadhaar_number');
    
    if (!aadhaarColumnExists) {
      console.log('\nAdding aadhaar_number column...');
      await db.query('ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR(12)');
      console.log('✅ aadhaar_number column added successfully');
    } else {
      console.log('\n✅ aadhaar_number column already exists');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAndAddPanColumn();