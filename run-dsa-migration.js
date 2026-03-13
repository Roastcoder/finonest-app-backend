import db from './src/config/database.js';

async function runMigration() {
  try {
    console.log('Starting migration: Adding dsa_id column to users table...');
    
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS dsa_id INT;
    `);
    
    console.log('✅ Column dsa_id added successfully');
    
    // Add foreign key constraint
    try {
      await db.query(`
        ALTER TABLE users ADD CONSTRAINT fk_users_dsa_id 
        FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE SET NULL;
      `);
      console.log('✅ Foreign key constraint added successfully');
    } catch (error) {
      if (error.code === '42710') {
        console.log('⚠️  Foreign key constraint already exists');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
