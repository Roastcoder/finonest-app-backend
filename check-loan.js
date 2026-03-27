import db from './src/config/database.js';

async function checkLoan() {
  try {
    console.log('\n🔍 Checking loan with RC: RJ14UK0040\n');
    
    // Check loans table
    const loanResult = await db.query(
      `SELECT id, loan_number, vehicle_number, applicant_name, owner_name, current_address, permanent_address 
       FROM loans 
       WHERE vehicle_number = 'RJ14UK0040' 
       LIMIT 1`
    );
    
    if (loanResult.rows.length === 0) {
      console.log('❌ No loan found with RC: RJ14UK0040');
      process.exit(0);
    }
    
    const loan = loanResult.rows[0];
    console.log('✅ Loan found:');
    console.log('   ID:', loan.id);
    console.log('   Loan Number:', loan.loan_number);
    console.log('   Vehicle Number:', loan.vehicle_number);
    console.log('   Applicant Name:', loan.applicant_name);
    console.log('   Owner Name (from loans table):', loan.owner_name);
    console.log('   Current Address:', loan.current_address);
    console.log('   Permanent Address:', loan.permanent_address);
    
    // Check RC cache
    console.log('\n🔍 Checking RC cache:\n');
    const rcResult = await db.query(
      `SELECT rc_number, rc_data->>'owner_name' as owner_name, rc_data->>'permanent_address' as address
       FROM rc_cache 
       WHERE rc_number = 'RJ14UK0040'`
    );
    
    if (rcResult.rows.length === 0) {
      console.log('❌ No RC data in cache');
    } else {
      const rc = rcResult.rows[0];
      console.log('✅ RC data in cache:');
      console.log('   RC Number:', rc.rc_number);
      console.log('   Owner Name:', rc.owner_name);
      console.log('   Address:', rc.address);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkLoan();
