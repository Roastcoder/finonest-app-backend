import db from './src/config/database.js';

async function deleteTestApplications() {
  const client = await db.connect();
  try {
    console.log('🧪 Starting deletion of test/demo loan applications...\n');

    // Step 1: Get count of test applications before deletion
    const beforeCount = await client.query(`
      SELECT COUNT(*) as count FROM loans 
      WHERE loan_number LIKE 'CL-%' 
      OR loan_number LIKE 'TEST-%' 
      OR applicant_name ILIKE '%test%'
      OR applicant_name ILIKE '%demo%'
    `);
    console.log(`📊 Test applications before deletion: ${beforeCount.rows[0].count}`);

    if (beforeCount.rows[0].count === 0) {
      console.log('✅ No test applications found to delete.');
      process.exit(0);
    }

    // Step 2: Get list of test loan IDs
    const testLoans = await client.query(`
      SELECT id, loan_number, applicant_name FROM loans 
      WHERE loan_number LIKE 'CL-%' 
      OR loan_number LIKE 'TEST-%' 
      OR applicant_name ILIKE '%test%'
      OR applicant_name ILIKE '%demo%'
    `);

    console.log('\n📋 Test applications to be deleted:');
    testLoans.rows.forEach(loan => {
      console.log(`   - ${loan.loan_number}: ${loan.applicant_name}`);
    });

    const testLoanIds = testLoans.rows.map(loan => loan.id);

    // Step 3: Delete related data first
    console.log('\n🔗 Deleting related data...');
    
    // Delete commissions
    const commissionsResult = await client.query('DELETE FROM commissions WHERE loan_id = ANY($1)', [testLoanIds]);
    console.log(`   ✅ Deleted ${commissionsResult.rowCount} commission records`);

    // Delete payout ledger entries
    const payoutResult = await client.query('DELETE FROM payout_ledger WHERE loan_id = ANY($1)', [testLoanIds]);
    console.log(`   ✅ Deleted ${payoutResult.rowCount} payout ledger entries`);

    // Delete RC folio accounts
    const folioResult = await client.query('DELETE FROM rc_folio_accounts WHERE loan_id = ANY($1)', [testLoanIds]);
    console.log(`   ✅ Deleted ${folioResult.rowCount} RC folio accounts`);

    // Delete insurance policies
    const insuranceResult = await client.query('DELETE FROM insurance_policies WHERE loan_id = ANY($1)', [testLoanIds]);
    console.log(`   ✅ Deleted ${insuranceResult.rowCount} insurance policies`);

    // Step 4: Delete test loan applications
    console.log('\n🗑️  Deleting test loan applications...');
    const loansResult = await client.query(`
      DELETE FROM loans 
      WHERE loan_number LIKE 'CL-%' 
      OR loan_number LIKE 'TEST-%' 
      OR applicant_name ILIKE '%test%'
      OR applicant_name ILIKE '%demo%'
    `);
    console.log(`   ✅ Deleted ${loansResult.rowCount} test loan applications`);

    // Step 5: Verify deletion
    const afterCount = await client.query(`
      SELECT COUNT(*) as count FROM loans 
      WHERE loan_number LIKE 'CL-%' 
      OR loan_number LIKE 'TEST-%' 
      OR applicant_name ILIKE '%test%'
      OR applicant_name ILIKE '%demo%'
    `);
    console.log(`\n📊 Test applications after deletion: ${afterCount.rows[0].count}`);

    // Show remaining applications
    const remainingCount = await client.query('SELECT COUNT(*) as count FROM loans');
    console.log(`📊 Total applications remaining: ${remainingCount.rows[0].count}`);

    console.log('\n✅ Test loan applications deleted successfully!');
    console.log('✅ Production data preserved.');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during deletion:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

console.log('🧪 This will delete ONLY test/demo loan applications:');
console.log('📋 Criteria for deletion:');
console.log('   - Loan numbers starting with "CL-" or "TEST-"');
console.log('   - Applicant names containing "test" or "demo"');
console.log('\n✅ Production data will be preserved.');
console.log('\nPress Ctrl+C to cancel or wait 3 seconds to continue...\n');

// 3 second delay before execution
setTimeout(() => {
  deleteTestApplications();
}, 3000);