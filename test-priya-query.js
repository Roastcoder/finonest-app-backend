import db from './src/config/database.js';

async function testPriyaQuery() {
  try {
    const priyaId = 24;
    const priyaRole = 'branch_manager';
    
    console.log('=== Testing query for Priya (branch_manager) ===');
    console.log('Priya ID:', priyaId);
    console.log('Priya Role:', priyaRole);
    
    let query = `
      SELECT l.*, 
             COALESCE(u.full_name, u.user_id) as assigned_to_name,
             COALESCE(creator.full_name, creator.user_id) as created_by_name,
             COALESCE(b.name, l.financier_name) as bank_name,
             br.name as broker_name,
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage
      FROM loans l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users creator ON l.created_by = creator.id
      LEFT JOIN banks b ON COALESCE(l.assigned_bank_id, l.bank_id) = b.id
      LEFT JOIN brokers br ON COALESCE(l.assigned_broker_id, l.broker_id) = br.id
    `;
    
    const conditions = [];
    const values = [];
    
    if (priyaRole === 'branch_manager') {
      conditions.push(`(
        l.created_by IN (
          WITH RECURSIVE team_hierarchy AS (
            SELECT id FROM users WHERE reporting_to = $1
            UNION ALL
            SELECT u.id FROM users u
            INNER JOIN team_hierarchy t ON u.reporting_to = t.id
          )
          SELECT id FROM team_hierarchy
        )
        OR l.assigned_to = $1
      )`);
      values.push(priyaId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.created_at DESC';
    
    console.log('\n=== Query ===');
    console.log(query);
    console.log('\n=== Values ===');
    console.log(values);
    
    console.log('\n=== Results ===');
    const result = await db.query(query, values);
    console.log('Found loans:', result.rows.length);
    result.rows.forEach(loan => {
      console.log(`- ${loan.loan_number}: ${loan.applicant_name} (assigned_to: ${loan.assigned_to}, created_by: ${loan.created_by})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPriyaQuery();
