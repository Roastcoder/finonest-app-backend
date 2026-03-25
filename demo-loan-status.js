import db from './src/config/database.js';
import applicationStageLogic from './src/utils/enhancedApplicationStageLogic.js';

const demonstrateLoanStatusUpdate = async () => {
  console.log('🚀 Demonstrating Loan Status Update...\n');
  
  try {
    // Get the first loan
    const loanResult = await db.query(`
      SELECT id, loan_number, customer_name, application_stage 
      FROM loans 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (loanResult.rows.length === 0) {
      console.log('❌ No loans found to demonstrate with');
      return;
    }
    
    const loan = loanResult.rows[0];
    console.log(`📋 Working with loan: ${loan.loan_number} - ${loan.customer_name}`);
    console.log(`📊 Current stage: ${loan.application_stage || 'NULL'}\n`);
    
    // Normalize the current stage
    const currentStage = (loan.application_stage || 'SUBMITTED').toUpperCase();\n    
    // Get available transitions
    const availableTransitions = applicationStageLogic.STAGE_TRANSITIONS[currentStage] || [];
    console.log(`🔄 Available transitions from ${currentStage}:`, availableTransitions);
    
    if (availableTransitions.length === 0) {
      console.log('ℹ️ No transitions available (terminal stage)');
      return;
    }
    
    // Demonstrate LOGIN stage update
    if (availableTransitions.includes('LOGIN')) {
      console.log('\\n1️⃣ Updating to LOGIN stage...');
      
      const loginResult = await applicationStageLogic.updateLoanApplicationStage(
        loan.id,
        'LOGIN',
        {
          appScore: 750,
          creditScore: 680
        },
        1 // Assuming user ID 1 exists
      );
      
      console.log('✅ LOGIN stage update result:', loginResult.message);
      
      // Get updated loan
      const updatedLoan = await db.query(`
        SELECT application_stage, app_score, credit_score, stage_data
        FROM loans 
        WHERE id = $1
      `, [loan.id]);
      
      const updated = updatedLoan.rows[0];
      console.log(`📊 New stage: ${updated.application_stage}`);
      console.log(`📊 App Score: ${updated.app_score}`);
      console.log(`📊 Credit Score: ${updated.credit_score}`);
      
      // Demonstrate IN_PROCESS stage update
      console.log('\\n2️⃣ Updating to IN_PROCESS stage...');
      
      const inProcessResult = await applicationStageLogic.updateLoanApplicationStage(
        loan.id,
        'IN_PROCESS',
        {
          tags: ['high-priority', 'verified-income']
        },
        1
      );
      
      console.log('✅ IN_PROCESS stage update result:', inProcessResult.message);
      
      // Demonstrate APPROVED stage update
      console.log('\\n3️⃣ Updating to APPROVED stage...');
      
      const approvedResult = await applicationStageLogic.updateLoanApplicationStage(
        loan.id,
        'APPROVED',
        {
          loanAmount: 500000,
          roi: 12.5,
          tenure: 36,
          remarks: 'Approved after verification'
        },
        1
      );
      
      console.log('✅ APPROVED stage update result:', approvedResult.message);
      
      // Get final loan state
      const finalLoan = await db.query(`
        SELECT application_stage, loan_amount, roi, tenure, stage_history
        FROM loans 
        WHERE id = $1
      `, [loan.id]);
      
      const final = finalLoan.rows[0];
      console.log(`\\n📊 Final loan state:`);
      console.log(`   Stage: ${final.application_stage}`);
      console.log(`   Loan Amount: ₹${final.loan_amount?.toLocaleString()}`);
      console.log(`   ROI: ${final.roi}%`);
      console.log(`   Tenure: ${final.tenure} months`);
      console.log(`   Stage History: ${final.stage_history?.length || 0} entries`);
      
      // Show stage history
      if (final.stage_history && final.stage_history.length > 0) {
        console.log('\\n📈 Stage History:');
        final.stage_history.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.stage} - ${entry.updatedAt}`);
        });
      }
      
      console.log('\\n🎉 Loan status update demonstration completed successfully!');
      
      // Show what the frontend would see
      console.log('\\n🖥️ Frontend Display Data:');
      console.log(`   Status Badge: "${applicationStageLogic.STAGE_LABELS[final.application_stage]}" (${applicationStageLogic.STAGE_COLORS[final.application_stage]})`);
      
      const nextTransitions = applicationStageLogic.STAGE_TRANSITIONS[final.application_stage] || [];
      console.log(`   Available Actions: ${nextTransitions.map(t => applicationStageLogic.STAGE_LABELS[t]).join(', ') || 'None (Terminal Stage)'}`);
      
    } else {
      console.log(`ℹ️ LOGIN transition not available from ${currentStage}`);
      console.log(`Available transitions: ${availableTransitions.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    throw error;
  }
};

// Run the demonstration
demonstrateLoanStatusUpdate()
  .then(() => {
    console.log('\\n✅ Demonstration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\\n💥 Demonstration failed:', error);
    process.exit(1);
  });