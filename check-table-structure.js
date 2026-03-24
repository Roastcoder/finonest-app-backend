import db from './src/config/database.js';

async function checkTableStructure() {
  try {
    console.log('Checking users table structure...');
    
    const tableStructure = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    tableStructure.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.column_default || 'None'}`);
    });
    
    console.log(`\nTotal columns: ${tableStructure.rows.length}`);
    
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();