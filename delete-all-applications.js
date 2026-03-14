import db from './src/config/database.js';

async function deleteAllApplications() {
  const client = await db.connect();
  try {
    console.log('🗑️  Starting deletion of all loan applications...\n');

    // Step 1: Get count of applications before deletion
    const beforeCount = await client.query('SELECT COUNT(*) as count FROM loans');
    console.log(`📊 Total applications before deletion: ${beforeCount.rows[0].count}`);

    // Step 2: Delete related data first (to avoid foreign key constraints)
    console.log('\n🔗 Deleting related data...');
    
    // Delete commissions
    const commissionsResult = await client.query('DELETE FROM commissions WHERE loan_id IN (SELECT id FROM loans)');
    console.log(`   ✅ Deleted ${commissionsResult.rowCount} commission records`);

    // Delete payout ledger entries
    const payoutResult = await client.query('DELETE FROM payout_ledger WHERE loan_id IN (SELECT id FROM loans)');
    console.log(`   ✅ Deleted ${payoutResult.rowCount} payout ledger entries`);

    // Delete RC folio accounts
    const folioResult = await client.query('DELETE FROM rc_folio_accounts WHERE loan_id IN (SELECT id FROM loans)');
    console.log(`   ✅ Deleted ${folioResult.rowCount} RC folio accounts`);

    // Delete insurance policies
    const insuranceResult = await client.query('DELETE FROM insurance_policies WHERE loan_id IN (SELECT id FROM loans)');
    console.log(`   ✅ Deleted ${insuranceResult.rowCount} insurance policies`);

    // Step 3: Delete all loan applications
    console.log('\n🗑️  Deleting loan applications...');
    const loansResult = await client.query('DELETE FROM loans');
    console.log(`   ✅ Deleted ${loansResult.rowCount} loan applications`);

    // Step 4: Reset auto-increment sequences (if using SERIAL)
    console.log('\n🔄 Resetting sequences...');
    await client.query('ALTER SEQUENCE loans_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE commissions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE payout_ledger_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE rc_folio_accounts_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE insurance_policies_id_seq RESTART WITH 1');
    console.log('   ✅ All sequences reset to start from 1');

    // Step 5: Verify deletion
    const afterCount = await client.query('SELECT COUNT(*) as count FROM loans');
    console.log(`\n📊 Total applications after deletion: ${afterCount.rows[0].count}`);

    console.log('\n✅ All loan applications and related data deleted successfully!');
    console.log('⚠️  Note: This action cannot be undone.');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during deletion:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL loan applications and related data!');
console.log('📋 This includes:');
console.log('   - All loan applications');
console.log('   - All commission records');
console.log('   - All payout ledger entries');
console.log('   - All RC folio accounts');
console.log('   - All insurance policies');
console.log('   - All related sequences will be reset');
console.log('\n🚨 THIS ACTION CANNOT BE UNDONE!');
console.log('\nPress Ctrl+C to cancel or wait 5 seconds to continue...\n');

// 5 second delay before execution
setTimeout(() => {
  deleteAllApplications();
}, 5000);