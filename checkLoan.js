import dotenv from 'dotenv';
import db from './backend/src/config/database.js';

// Load environment variables from backend/.env
dotenv.config({ path: './backend/.env' });

const checkLoanNumber = async (loanNumber) => {
  try {
    console.log(`🔍 Searching for loan number: ${loanNumber}`);
    
    const query = `
      SELECT 
        id,
        loan_number,
        applicant_name,
        customer_name,
        mobile,
        loan_amount,
        application_stage,
        created_at,
        updated_at,
        status
      FROM loans 
      WHERE loan_number = $1
    `;
    
    const result = await db.query(query, [loanNumber]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Loan number "${loanNumber}" not found in database`);
      return null;
    }
    
    console.log(`✅ Found loan: ${loanNumber}`);
    console.log('📋 Loan Details:');
    console.log('================');
    
    const loan = result.rows[0];
    console.log(`ID: ${loan.id}`);
    console.log(`Loan Number: ${loan.loan_number}`);
    console.log(`Applicant: ${loan.applicant_name || loan.customer_name || 'N/A'}`);
    console.log(`Mobile: ${loan.mobile || 'N/A'}`);
    console.log(`Loan Amount: ${loan.loan_amount || 'N/A'}`);
    console.log(`Stage: ${loan.application_stage || 'N/A'}`);
    console.log(`Status: ${loan.status || 'N/A'}`);
    console.log(`Created: ${loan.created_at || 'N/A'}`);
    console.log(`Updated: ${loan.updated_at || 'N/A'}`);
    
    return loan;
    
  } catch (error) {
    console.error('❌ Error checking loan:', error.message);
    throw error;
  }
};

// Check the specific loan number
checkLoanNumber('CL-2026-1701')
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error.message);
    process.exit(1);
  });