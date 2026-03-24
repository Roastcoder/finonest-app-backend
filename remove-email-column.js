import db from './src/config/database.js';

async function removeEmailColumn() {
  try {
    console.log('Removing email column from users table...');
    
    // First, let's check if the email column exists
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('✅ Email column does not exist in users table');
      return;
    }
    
    console.log('📋 Email column found, proceeding with removal...');
    
    // Remove the email column
    await db.query('ALTER TABLE users DROP COLUMN IF EXISTS email');
    
    console.log('✅ Email column removed successfully from users table');
    
    // Verify the column is removed
    const verifyCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    
    if (verifyCheck.rows.length === 0) {
      console.log('✅ Verification: Email column successfully removed');
    } else {
      console.log('❌ Verification failed: Email column still exists');
    }
    
    // Show current table structure
    const tableStructure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current users table structure:');
    tableStructure.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error removing email column:', error);
  } finally {
    process.exit(0);
  }
}

removeEmailColumn();