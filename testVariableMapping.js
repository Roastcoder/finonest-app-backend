import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

// Test FINODEMO template after variable mapping
async function testFinodemoWithMapping() {
  console.log('🧪 Testing FINODEMO template with proper variable mapping...\n');

  const testData = {
    customer_name: 'Yogi Faujdar',
    subject: '🎉 Loan Approved!',
    loan_id: 'LOAN123',
    vehicle_details: 'Maruti Swift VXI',
    amount: '₹5,00,000',
    status: 'APPROVED',
    next_step: 'Submit documents within 7 days',
    contact: 'Call: +919462553887',
    closing: 'Congratulations from Finonest India!'
  };

  try {
    // Method 1: Using parameters array
    console.log('📤 Method 1: Using parameters array...');
    const response1 = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
          testData.customer_name,
          testData.subject,
          testData.loan_id,
          testData.vehicle_details,
          testData.amount,
          testData.status,
          testData.next_step,
          testData.contact,
          testData.closing
        ]
      }
    );

    if (response1.data.status === '1') {
      console.log('✅ Method 1 SUCCESS!');
      console.log('📧 Message ID:', response1.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Method 1 failed:', response1.data.message);
    }

  } catch (error) {
    console.log('❌ Method 1 error:', error.response?.data?.message || error.message);
  }

  // Method 2: Using variable mapping (if BotBiz supports it)
  try {
    console.log('\n📤 Method 2: Using variable mapping...');
    const response2 = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        variables: testData // Using mapped variables
      }
    );

    if (response2.data.status === '1') {
      console.log('✅ Method 2 SUCCESS!');
      console.log('📧 Message ID:', response2.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Method 2 failed:', response2.data.message);
    }

  } catch (error) {
    console.log('❌ Method 2 error:', error.response?.data?.message || error.message);
  }

  return false;
}

// Test different loan scenarios
async function testLoanScenarios() {
  console.log('\n🏦 Testing different loan scenarios...\n');

  const scenarios = [
    {
      name: 'Loan Approval',
      data: [
        'Yogi Faujdar',
        '🎉 Loan Approved!',
        'LOAN123',
        'Maruti Swift VXI',
        '₹5,00,000',
        'APPROVED',
        'Submit documents within 7 days',
        'Contact: +919462553887',
        'Congratulations from Finonest!'
      ]
    },
    {
      name: 'Document Request',
      data: [
        'Yogi Faujdar',
        '📄 Documents Required',
        'LOAN123',
        'Maruti Swift VXI',
        'PAN, Aadhar, Salary Slip',
        'PENDING',
        'Upload within 3 days',
        'Contact: +919462553887',
        'Please submit soon'
      ]
    },
    {
      name: 'EMI Reminder',
      data: [
        'Yogi Faujdar',
        '💰 EMI Due',
        'LOAN123',
        'Maruti Swift VXI',
        '₹12,500',
        'DUE',
        'Pay by 20-Jan-2025',
        'Contact: +919462553887',
        'Pay on time please'
      ]
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`🧪 Testing: ${scenario.name}`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_name: 'finodemo',
          phone_number: TARGET_PHONE,
          parameters: scenario.data
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${scenario.name}: SUCCESS!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        break; // Stop after first success
      } else {
        console.log(`❌ ${scenario.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${scenario.name}: ${error.response?.data?.message || error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function main() {
  console.log('🎯 FINODEMO Template Variable Mapping Test\n');
  
  const success = await testFinodemoWithMapping();
  
  if (success) {
    console.log('\n🎊 SUCCESS! Variable mapping works!');
    await testLoanScenarios();
  } else {
    console.log('\n⚠️ Variable mapping not working yet.');
    console.log('📋 Steps to fix:');
    console.log('1. Login to BotBiz dashboard');
    console.log('2. Go to Templates → finodemo');
    console.log('3. Map variables {{1}} to {{9}}');
    console.log('4. Enable API access');
    console.log('5. Save and test again');
  }
}

main();