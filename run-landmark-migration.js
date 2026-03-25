import db from './src/config/database.js';

async function runMigration() {
  try {
    console.log('Starting landmark migration...');
    
    // Add landmark columns to loans table
    await db.query(`
      ALTER TABLE loans 
      ADD COLUMN IF NOT EXISTS current_landmark VARCHAR(255),
      ADD COLUMN IF NOT EXISTS permanent_landmark VARCHAR(255),
      ADD COLUMN IF NOT EXISTS landmark VARCHAR(255);
    `);
    
    console.log('✅ Landmark columns added successfully');
    
    // Verify columns exist
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name IN ('current_landmark', 'permanent_landmark', 'landmark')
      ORDER BY column_name;
    `);
    
    console.log('Columns in loans table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
