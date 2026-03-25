import pool from '../config/database.js';

const loanIdsToDelete = [
  'CL-2026-1961',
  'CL-2026-8042',
  'CL-2026-6411',
  'CL-2026-7410',
  'CL-2026-9766',
  'CL-2026-4085'
];

async function deleteLoans() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const loanId of loanIdsToDelete) {
      // Delete loan documents
      await client.query('DELETE FROM loan_documents WHERE loan_id = $1', [loanId]);
      
      // Delete loan timeline
      await client.query('DELETE FROM loan_timeline WHERE loan_id = $1', [loanId]);
      
      // Delete the loan
      const result = await client.query('DELETE FROM loans WHERE id = $1 RETURNING *', [loanId]);
      
      if (result.rows.length > 0) {
        console.log(`✓ Deleted loan: ${loanId}`);
      } else {
        console.log(`✗ Loan not found: ${loanId}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✓ All loans deleted successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting loans:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteLoans().catch(console.error);
