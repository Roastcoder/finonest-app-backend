import db from './src/config/database.js';

async function checkPriya() {
  try {
    console.log('=== Checking Priya User ===');
    const userResult = await db.query(`
      SELECT id, user_id, full_name, role, reporting_to, dsa_id 
      FROM users 
      WHERE full_name ILIKE '%priya%'
    `);
    console.log('Priya user:', JSON.stringify(userResult.rows, null, 2));
    
    if (userResult.rows.length > 0) {
      const priyaId = userResult.rows[0].id;
      
      console.log('\n=== Loans assigned to Priya ===');
      const assignedLoans = await db.query(`
        SELECT id, loan_number, applicant_name, assigned_to, created_by 
        FROM loans 
        WHERE assigned_to = $1
      `, [priyaId]);
      console.log('Assigned loans:', JSON.stringify(assignedLoans.rows, null, 2));
      
      console.log('\n=== Recent 5 loans ===');
      const recentLoans = await db.query(`
        SELECT id, loan_number, applicant_name, assigned_to, created_by 
        FROM loans 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      console.log('Recent loans:', JSON.stringify(recentLoans.rows, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPriya();
