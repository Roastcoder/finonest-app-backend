import db from './config/database.js';

const addReferCodeColumn = async () => {
  try {
    console.log('🔄 Checking if refer_code column exists...');
    
    // Check if column exists
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='refer_code'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('➕ Adding refer_code column to users table...');
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN refer_code VARCHAR(8) UNIQUE
      `);
      console.log('✅ refer_code column added successfully!');
    } else {
      console.log('✅ refer_code column already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

addReferCodeColumn();
