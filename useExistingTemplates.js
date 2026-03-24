import axios from 'axios';

// Use existing approved templates for loan notifications
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TEST_PHONE = '916378110608';

// Your approved templates with variable counts
const APPROVED_TEMPLATES = {
  demo: 9,        // 9 variables - PERFECT for loan notifications
  testing: 4,     // 4 variables - Good for simple updates
  promo_offer: 0, // No variables - Fixed promotional content
  new_year_greetings: 0, // No variables - Fixed greeting
  data_rc: 7,     // 7 variables - Good for verification
  cc_offer: 2     // 2 variables - Simple offers
};

// Loan notification using DEMO template (9 variables)
async function sendLoanNotificationWithDemo(phone, loanData) {
  console.log('📤 Sending loan notification using DEMO template...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'demo',
        phone_number: phone,
        parameters: [
          loanData.customerName,     // {{1}} - Customer name
          loanData.subject,          // {{2}} - Subject/Title
          loanData.loanId,          // {{3}} - Loan ID
          loanData.vehicle,         // {{4}} - Vehicle details
          loanData.amount,          // {{5}} - Loan amount
          loanData.status,          // {{6}} - Current status
          loanData.nextStep,        // {{7}} - Next action
          loanData.contact,         // {{8}} - Contact info
          loanData.closing          // {{9}} - Closing message
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Loan notification sent successfully!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Different loan scenarios using DEMO template
const LOAN_SCENARIOS = {
  approval: {
    customerName: 'Yogi Faujdar',
    subject: '🎉 Loan Approved!',
    loanId: 'LOAN123',
    vehicle: 'Maruti Swift VXI',
    amount: '₹5,00,000',
    status: 'APPROVED',
    nextStep: 'Documentation process',
    contact: 'Call: +919462553887',
    closing: 'Congratulations - Finonest India'
  },

  documentRequest: {
    customerName: 'Yogi Faujdar',
    subject: '📄 Document Required',
    loanId: 'LOAN123',
    vehicle: 'For your application',
    amount: 'PAN Card needed',
    status: 'Pending verification',
    nextStep: 'Submit within 3 days',
    contact: 'Help: +919462553887',
    closing: 'Thank you - Finonest India'
  },

  disbursement: {
    customerName: 'Yogi Faujdar',
    subject: '💰 Loan Disbursed',
    loanId: 'LOAN123',
    vehicle: 'Maruti Swift VXI',
    amount: '₹5,00,000 credited',
    status: 'DISBURSED',
    nextStep: 'EMI starts next month',
    contact: 'Support: +919462553887',
    closing: 'Thank you - Finonest India'
  },

  emiReminder: {
    customerName: 'Yogi Faujdar',
    subject: '💳 EMI Reminder',
    loanId: 'LOAN123',
    vehicle: 'Payment due soon',
    amount: '₹12,500',
    status: 'Due: 20-Jan-2024',
    nextStep: 'Pay before due date',
    contact: 'Support: +919462553887',
    closing: 'Finonest India'
  },

  rejection: {
    customerName: 'Yogi Faujdar',
    subject: 'Application Update',
    loanId: 'LOAN123',
    vehicle: 'Status: Not approved',
    amount: 'Reason: Income docs',
    status: 'Can reapply later',
    nextStep: 'Improve eligibility',
    contact: 'Guidance: +919462553887',
    closing: 'Finonest India'
  }
};

// Test all loan scenarios
async function testAllScenarios() {
  console.log('🧪 Testing all loan scenarios with DEMO template...\n');

  for (const [scenario, data] of Object.entries(LOAN_SCENARIOS)) {
    console.log(`📋 Testing: ${scenario.toUpperCase()}`);
    console.log(`Subject: ${data.subject}`);
    
    const success = await sendLoanNotificationWithDemo(TEST_PHONE, data);
    
    if (success) {
      console.log(`✅ ${scenario} notification sent`);
    } else {
      console.log(`❌ ${scenario} notification failed`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Wait 2 seconds between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Simple loan notification using TESTING template (4 variables)
async function sendSimpleNotificationWithTesting(phone, customerName, message, details, action) {
  console.log('📤 Sending simple notification using TESTING template...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'testing',
        phone_number: phone,
        parameters: [
          customerName,  // {{1}} - Name
          message,       // {{2}} - Main message
          details,       // {{3}} - Details
          action         // {{4}} - Action/closing
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Simple notification sent successfully!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Show template usage guide
function showUsageGuide() {
  console.log('📱 How to Use Existing Templates for Loan Notifications\n');
  
  console.log('✅ DEMO Template (9 variables) - Best for detailed notifications:');
  console.log('   - Loan approvals with full details');
  console.log('   - Document requests with context');
  console.log('   - Disbursement confirmations');
  console.log('   - Status updates with next steps\n');
  
  console.log('✅ TESTING Template (4 variables) - Good for simple updates:');
  console.log('   - Quick status updates');
  console.log('   - Simple reminders');
  console.log('   - Brief notifications\n');
  
  console.log('✅ DATA_RC Template (7 variables) - Good for verification:');
  console.log('   - Document verification');
  console.log('   - Data confirmation');
  console.log('   - Information requests\n');
  
  console.log('🎯 RECOMMENDATION: Use DEMO template for everything!');
  console.log('   It has 9 variables - enough for any loan notification\n');
}

// Main function
async function main() {
  const action = process.argv[2];

  switch (action) {
    case 'test-demo':
      await sendLoanNotificationWithDemo(TEST_PHONE, LOAN_SCENARIOS.approval);
      break;
      
    case 'test-all':
      await testAllScenarios();
      break;
      
    case 'test-simple':
      await sendSimpleNotificationWithTesting(
        TEST_PHONE,
        'Yogi Faujdar',
        'Your loan LOAN123 is approved',
        'Amount: ₹5,00,000',
        'Contact: +919462553887'
      );
      break;
      
    case 'guide':
      showUsageGuide();
      break;
      
    default:
      console.log('🚀 Use Existing Templates for Loan Notifications\n');
      console.log('Commands:');
      console.log('  node useExistingTemplates.js test-demo    - Test loan approval with DEMO');
      console.log('  node useExistingTemplates.js test-all     - Test all loan scenarios');
      console.log('  node useExistingTemplates.js test-simple  - Test with TESTING template');
      console.log('  node useExistingTemplates.js guide        - Show usage guide');
      console.log('');
      console.log('🎯 Quick start: node useExistingTemplates.js test-demo');
  }
}

// Export for use in other files
export { sendLoanNotificationWithDemo, sendSimpleNotificationWithTesting, LOAN_SCENARIOS };

// Run if called directly
if (process.argv[1].endsWith('useExistingTemplates.js')) {
  main();
}