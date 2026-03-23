import db from './src/config/database.js';

async function addReferCodeColumn() {
  const client = await db.connect();
  try {
    console.log('Adding refer_code column...');
    
    // Add refer_code column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS refer_code VARCHAR(20) UNIQUE
    `);
    
    console.log('Generating refer codes for existing users...');
    
    // Generate refer codes for existing team leaders, branch managers, and DSAs
    const result = await client.query(`
      UPDATE users 
      SET refer_code = CONCAT(
        CASE 
          WHEN role = 'team_leader' THEN 'TL'
          WHEN role = 'branch_manager' THEN 'BM'
          WHEN role = 'dsa' THEN 'DSA'
        END,
        LPAD(id::text, 4, '0')
      )
      WHERE role IN ('team_leader', 'branch_manager', 'dsa') AND refer_code IS NULL
    `);
    
    console.log(`Generated refer codes for ${result.rowCount} users`);
    
    // Show updated users
    const users = await client.query(`
      SELECT id, full_name, role, refer_code 
      FROM users 
      WHERE role IN ('team_leader', 'branch_manager', 'dsa') 
      ORDER BY role, id
    `);
    
    console.log('\nUsers with refer codes:');
    console.table(users.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

addReferCodeColumn();