import db from './src/config/database.js';

async function testLeadsQuery() {
  try {
    console.log('Testing leads query...');
    
    const result = await db.query(`
      SELECT l.id, l.customer_name, 
             COALESCE(l.application_stage, 'SUBMITTED') as application_stage,
             COALESCE(l.converted_to_loan, false) as converted_to_loan
      FROM leads l
      WHERE COALESCE(l.converted_to_loan, false) = false
      LIMIT 3
    `);
    
    console.log('✓ Query successful, returned', result.rows.length, 'rows');
    if (result.rows.length > 0) {
      console.log('Sample data:', result.rows[0]);
    }
    
  } catch (error) {
    console.error('Query failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testLeadsQuery();