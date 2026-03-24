import db from './src/config/database.js';

async function rollbackEmailColumn() {
  try {
    console.log('🔄 Rolling back email column...');
    
    // Check if email column already exists
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ Email column already exists. No rollback needed.');
      return;
    }
    
    // Add email column back
    await db.query('ALTER TABLE users ADD COLUMN email VARCHAR(255)');
    console.log('✅ Email column added back');
    
    // Update users with temp email based on phone
    const users = await db.query('SELECT id, phone FROM users WHERE phone IS NOT NULL');
    
    for (const user of users.rows) {
      const tempEmail = `${user.phone}@finonest.temp`;
      await db.query('UPDATE users SET email = $1 WHERE id = $2', [tempEmail, user.id]);
    }
    
    console.log(`✅ Updated ${users.rows.length} users with temp email addresses`);
    console.log('🎉 Rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

rollbackEmailColumn();