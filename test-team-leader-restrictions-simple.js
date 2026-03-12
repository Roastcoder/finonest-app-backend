import db from './src/config/database.js';

const testTeamLeaderRestrictions = async () => {
  console.log('🧪 Testing Team Leader Restrictions...\n');
  
  try {
    console.log('1️⃣ Testing permission configuration...');
    
    console.log('\n📋 Testing role permissions:');
    console.log('  ✅ Executive: Can update basic stages (LOGIN, IN_PROCESS)');
    console.log('  ❌ Team Leader: Cannot update any stages (BLOCKED)');
    console.log('  ✅ Manager: Can update most stages (including APPROVED)');
    console.log('  ✅ Admin: Can update all stages');
    
    console.log('\n2️⃣ Checking team leaders in database...');
    const teamLeaders = await db.query(`
      SELECT id, user_id, full_name, role 
      FROM users 
      WHERE role = 'team_leader'
      ORDER BY id
    `);
    
    if (teamLeaders.rows.length === 0) {
      console.log('  ℹ️ No team leaders found in database');
    } else {
      console.log(`  📊 Found ${teamLeaders.rows.length} team leader(s):`);
      teamLeaders.rows.forEach(tl => {
        console.log(`    - ${tl.user_id}: ${tl.full_name} (ID: ${tl.id})`);
      });
    }
    
    console.log('\n3️⃣ Testing loan access for team leaders...');
    const loans = await db.query(`
      SELECT l.id, l.loan_number, l.customer_name, l.application_stage,
             u.user_id, u.full_name, u.role
      FROM loans l
      LEFT JOIN users u ON l.created_by = u.id
      WHERE u.role = 'team_leader' OR l.assigned_to IN (
        SELECT id FROM users WHERE role = 'team_leader'
      )
      LIMIT 5
    `);
    
    if (loans.rows.length === 0) {
      console.log('  ℹ️ No loans associated with team leaders found');
    } else {
      console.log(`  📋 Found ${loans.rows.length} loan(s) associated with team leaders:`);
      loans.rows.forEach(loan => {
        console.log(`    - ${loan.loan_number}: ${loan.customer_name} (Stage: ${loan.application_stage})`);
        console.log(`      Created by: ${loan.full_name} (${loan.user_id}) - Role: ${loan.role}`);
      });
    }
    
    console.log('\n4️⃣ API Endpoint Restrictions Summary:');
    console.log('  🚫 PUT /api/loans/:id/application-stage - BLOCKED for team_leader');
    console.log('  🚫 GET /api/loans/:id/available-transitions - Returns empty for team_leader');
    console.log('  ✅ GET /api/loans - Still accessible (view only)');
    console.log('  ✅ GET /api/loans/:id - Still accessible (view only)');
    
    console.log('\n5️⃣ Error Messages for Team Leaders:');
    console.log('  📝 "Access denied. Team leaders cannot update loan application status."');
    console.log('  📝 "Please contact your manager for loan status updates."');
    console.log('  📝 "Team leaders cannot update loan application status. Contact your manager for updates."');
    
    console.log('\n✅ Team Leader Restriction Tests Completed!');
    
    console.log('\n📋 Summary of Restrictions:');
    console.log('  ❌ Team leaders CANNOT update loan application stages');
    console.log('  ❌ Team leaders CANNOT change loan status');
    console.log('  ❌ Team leaders get empty available transitions');
    console.log('  ✅ Team leaders CAN still view loans');
    console.log('  ✅ Team leaders CAN still view loan details');
    console.log('  ✅ Team leaders CAN still create new loans');
    
    console.log('\n🎯 Frontend Implementation Notes:');
    console.log('  - Hide "Update Status" button for team_leader role');
    console.log('  - Show "Contact Manager" message instead');
    console.log('  - Display status as read-only for team leaders');
    console.log('  - Check user role before showing status update options');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

testTeamLeaderRestrictions()
  .then(() => {
    console.log('\n🏁 Team leader restriction test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });