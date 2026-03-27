import db from './src/config/database.js';

async function debugRCData() {
  try {
    console.log('\n🔍 DEBUG: Checking complete data flow for RJ14UK0040\n');
    
    // Step 1: Check RC cache
    console.log('STEP 1: RC Cache Data');
    console.log('='.repeat(80));
    const rcCache = await db.query(
      `SELECT rc_data FROM rc_cache WHERE rc_number = 'RJ14UK0040'`
    );
    
    if (rcCache.rows.length > 0) {
      const rcData = rcCache.rows[0].rc_data;
      console.log('✅ RC Cache found');
      console.log('permanent_address:', rcData.permanent_address);
      console.log('present_address:', rcData.present_address);
    } else {
      console.log('❌ RC Cache NOT found');
    }
    
    // Step 2: Check loan data
    console.log('\nSTEP 2: Loan Data');
    console.log('='.repeat(80));
    const loan = await db.query(
      `SELECT id, vehicle_number, applicant_name, owner_name, current_address, permanent_address FROM loans WHERE vehicle_number = 'RJ14UK0040'`
    );
    
    if (loan.rows.length > 0) {
      const l = loan.rows[0];
      console.log('✅ Loan found');
      console.log('Loan ID:', l.id);
      console.log('applicant_name:', l.applicant_name);
      console.log('owner_name:', l.owner_name);
      console.log('current_address:', l.current_address);
      console.log('permanent_address:', l.permanent_address);
    } else {
      console.log('❌ Loan NOT found');
    }
    
    // Step 3: Check what getLoanById would return
    console.log('\nSTEP 3: getLoanById Query Result (with RC merge)');
    console.log('='.repeat(80));
    const fullLoan = await db.query(
      `SELECT l.*, rc.rc_data as rc_details
       FROM loans l
       LEFT JOIN rc_cache rc ON l.vehicle_number = rc.rc_number
       WHERE l.vehicle_number = 'RJ14UK0040'`
    );
    
    if (fullLoan.rows.length > 0) {
      const merged = fullLoan.rows[0];
      console.log('✅ Full loan query executed');
      console.log('Loan owner_name:', merged.owner_name);
      console.log('Loan current_address:', merged.current_address);
      console.log('Loan permanent_address:', merged.permanent_address);
      
      if (merged.rc_details) {
        const rcData = typeof merged.rc_details === 'string' 
          ? JSON.parse(merged.rc_details) 
          : merged.rc_details;
        
        console.log('\n✅ RC Details from cache:');
        console.log('rc_details.permanent_address:', rcData.permanent_address);
        console.log('rc_details.present_address:', rcData.present_address);
        
        // Simulate what template will do AFTER Object.assign merge
        const mergedLoan = { ...merged, ...rcData };
        const addr = mergedLoan.permanent_address || mergedLoan.present_address || mergedLoan.current_address || '';
        
        console.log('\n✅ After Object.assign merge:');
        console.log('merged.permanent_address:', mergedLoan.permanent_address);
        console.log('merged.present_address:', mergedLoan.present_address);
        console.log('\nFinal address that template will use:', addr);
      } else {
        console.log('❌ RC Details NOT found in query result');
      }
    } else {
      console.log('❌ Full loan query returned no results');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugRCData();
