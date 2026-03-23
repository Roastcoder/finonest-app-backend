import db from './src/config/database.js';

async function updateReferCodes() {
  const client = await db.connect();
  try {
    console.log('Updating existing refer codes to 8 digit alphanumeric...');
    
    // Get users who have refer codes
    const usersResult = await client.query(`
      SELECT id, full_name, role, refer_code FROM users 
      WHERE role IN ('team_leader', 'branch_manager', 'dsa') AND refer_code IS NOT NULL
    `);
    
    let updatedCount = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (const user of usersResult.rows) {
      let referCode = '';
      let isUnique = false;
      
      // Generate unique 8 character code
      while (!isUnique) {
        referCode = '';
        for (let i = 0; i < 8; i++) {
          referCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const existingCode = await client.query(
          'SELECT id FROM users WHERE refer_code = $1 AND id != $2',
          [referCode, user.id]
        );
        
        if (existingCode.rows.length === 0) {
          isUnique = true;
        }
      }
      
      // Update user with new refer code
      await client.query(
        'UPDATE users SET refer_code = $1 WHERE id = $2',
        [referCode, user.id]
      );
      
      console.log(`Updated ${user.full_name} (${user.role}): ${user.refer_code} -> ${referCode}`);
      updatedCount++;
    }
    
    console.log(`\nUpdated ${updatedCount} users with new 8-digit alphanumeric refer codes`);
    
    // Show updated users
    const updatedUsers = await client.query(`
      SELECT id, full_name, role, refer_code 
      FROM users 
      WHERE role IN ('team_leader', 'branch_manager', 'dsa') 
      ORDER BY role, id
    `);
    
    console.log('\nUpdated users with new refer codes:');
    console.table(updatedUsers.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

updateReferCodes();