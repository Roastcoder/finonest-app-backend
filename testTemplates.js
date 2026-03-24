import axios from 'axios';

// Test the template system with your phone number
const API_BASE = 'http://localhost:5000/api';
const TEST_PHONE = '916378110608';

async function testTemplateSystem() {
  console.log('🧪 Testing Finonest Template System...\n');

  // Test data
  const testData = {
    leadId: 'LOAN123',
    customerName: 'Yogi Faujdar',
    vehicleDetails: 'Maruti Swift VXI',
    loanAmount: 500000,
    approvedAmount: 500000,
    emiAmount: 12500,
    tenure: 48,
    documentType: 'PAN Card',
    rejectionReason: 'Insufficient income documents',
    otpCode: '123456',
    maxLoanAmount: 1000000,
    interestRate: 8.5,
    validTill: '31-Dec-2024'
  };

  // Test 1: Loan Application Received
  try {
    console.log('📋 Testing: Loan Application Received Template');
    const response = await axios.post(`${API_BASE}/templates/test`, {
      templateName: 'loan_application_received',
      testPhone: TEST_PHONE
    });
    console.log('✅ Result:', response.data.message);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }

  console.log('\\n' + '='.repeat(50) + '\\n');

  // Test 2: Document Required
  try {
    console.log('📄 Testing: Document Required Template');
    const response = await axios.post(`${API_BASE}/templates/test`, {
      templateName: 'document_required',
      testPhone: TEST_PHONE
    });
    console.log('✅ Result:', response.data.message);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }

  console.log('\\n' + '='.repeat(50) + '\\n');

  // Test 3: Loan Approved
  try {
    console.log('🎉 Testing: Loan Approved Template');
    const response = await axios.post(`${API_BASE}/templates/test`, {
      templateName: 'loan_approved',
      testPhone: TEST_PHONE
    });
    console.log('✅ Result:', response.data.message);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }

  console.log('\\n' + '='.repeat(50) + '\\n');

  // Test 4: Welcome Customer
  try {
    console.log('👋 Testing: Welcome Customer Template');
    const response = await axios.post(`${API_BASE}/templates/test`, {
      templateName: 'welcome_customer',
      testPhone: TEST_PHONE
    });
    console.log('✅ Result:', response.data.message);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }

  console.log('\\n' + '='.repeat(50) + '\\n');

  // Test 5: Get Available Templates
  try {
    console.log('📋 Testing: Get Available Templates');
    const response = await axios.get(`${API_BASE}/templates/available`);
    console.log('✅ Available templates:', response.data.templates?.message?.length || 0);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }

  console.log('\\n📱 Summary:');
  console.log('• Test Phone: 916378110608 (Yogi Faujdar)');
  console.log('• Templates: loan_application_received, document_required, loan_approved, welcome_customer');
  console.log('• Note: Templates need to be created in BotBiz dashboard first');
  console.log('• For now, existing templates like "promo_offer" can be used');
}

// Test with existing BotBiz template
async function testExistingTemplate() {
  console.log('\\n🎯 Testing with existing BotBiz template...\\n');

  try {
    const response = await axios.post(`${API_BASE}/templates/send-custom`, {
      templateName: 'promo_offer',
      phoneNumber: TEST_PHONE,
      parameters: []
    });
    console.log('✅ Existing template test:', response.data.message);
  } catch (error) {
    console.log('❌ Existing template failed:', error.response?.data?.message || error.message);
  }
}

// Run tests
async function runAllTests() {
  await testTemplateSystem();
  await testExistingTemplate();
  
  console.log('\\n🚀 Template system is ready!');
  console.log('Next steps:');
  console.log('1. Create templates in BotBiz dashboard');
  console.log('2. Get them approved by WhatsApp');
  console.log('3. Use the template endpoints in your loan management system');
}

runAllTests();