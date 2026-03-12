import pool from '../config/database.js';

async function deleteAllLoans() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get all loan IDs first
    const loansResult = await client.query('SELECT id FROM loans');
    const loanIds = loansResult.rows.map(row => row.id);
    
    if (loanIds.length === 0) {
      console.log('No loans found to delete');
      await client.query('COMMIT');
      await pool.end();
      return;
    }
    
    console.log(`Found ${loanIds.length} loans to delete...`);
    
    // Delete in order of foreign key dependencies
    await client.query('DELETE FROM payout_ledger WHERE loan_id = ANY($1)', [loanIds]);
    console.log('✓ Deleted payout ledger entries');
    
    await client.query('DELETE FROM rc_ledger_entries WHERE folio_id IN (SELECT id FROM rc_folio_accounts WHERE loan_id = ANY($1))', [loanIds]);
    console.log('✓ Deleted RC ledger entries');
    
    await client.query('DELETE FROM rc_folio_accounts WHERE loan_id = ANY($1)', [loanIds]);
    console.log('✓ Deleted RC folio accounts');
    
    await client.query('DELETE FROM insurance_policies WHERE loan_id = ANY($1)', [loanIds]);
    console.log('✓ Deleted insurance policies');
    
    await client.query('DELETE FROM commissions WHERE loan_id = ANY($1)', [loanIds]);
    console.log('✓ Deleted commissions');
    
    await client.query('DELETE FROM loans WHERE id = ANY($1)', [loanIds]);
    console.log('✓ Deleted all loans');
    
    await client.query('COMMIT');
    console.log(`\n✓ Successfully deleted ${loanIds.length} loans and all related records`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting loans:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteAllLoans().catch(console.error);
