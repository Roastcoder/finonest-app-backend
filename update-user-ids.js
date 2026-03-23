import db from './src/config/database.js';

async function updateUserIds() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Get all users ordered by creation date
    const users = await client.query(`
      SELECT id, user_id, full_name, created_at 
      FROM users 
      ORDER BY created_at ASC, id ASC
    `);
    
    console.log(`Found ${users.rows.length} users to update`);
    
    // Update each user with new FN format
    for (let i = 0; i < users.rows.length; i++) {
      const user = users.rows[i];
      const sequence = String(i + 1).padStart(5, '0');
      const newUserId = `FN${sequence}`;
      
      await client.query(
        'UPDATE users SET user_id = $1 WHERE id = $2',
        [newUserId, user.id]
      );
      
      console.log(`Updated user ${user.full_name} (${user.user_id}) -> ${newUserId}`);
    }
    
    await client.query('COMMIT');
    console.log('✅ All user IDs updated successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating user IDs:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateUserIds();