import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testDemoTemplate() {
  console.log('🧪 Testing DEMO template (ID: 313823) with 9 variables...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'demo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // {{1}} - Name
          '🎉 Loan Approved!',         // {{2}} - Subject
          'LOAN123',                   // {{3}} - Loan ID
          'Maruti Swift VXI',          // {{4}} - Vehicle
          '₹5,00,000',                // {{5}} - Amount
          'APPROVED',                  // {{6}} - Status
          'Documentation needed',       // {{7}} - Next step
          'Call: +919462553887',       // {{8}} - Contact
          'Congratulations - Finonest' // {{9}} - Closing
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ DEMO template SUCCESS!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎯 Template works perfectly for loan notifications!');
    } else {
      console.log('❌ DEMO template failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

// Test with different loan scenarios
async function testLoanScenarios() {
  console.log('\n🏦 Testing different loan scenarios with DEMO template...\n');

  const scenarios = [
    {
      name: 'Loan Approval',
      params: [
        'Yogi Faujdar',
        '🎉 Loan Approved!',
        'LOAN123',
        'Maruti Swift VXI',
        '₹5,00,000',
        'APPROVED',
        'Documentation needed',
        'Call: +919462553887',
        'Congratulations - Finonest'
      ]
    },
    {
      name: 'Document Request',
      params: [
        'Yogi Faujdar',
        '📄 Documents Required',
        'LOAN123',
        'Maruti Swift VXI',
        'PAN, Aadhar, Salary Slip',
        'PENDING',
        'Submit within 3 days',
        'Call: +919462553887',
        'Upload soon - Finonest'
      ]
    },
    {
      name: 'EMI Reminder',
      params: [
        'Yogi Faujdar',
        '💰 EMI Reminder',
        'LOAN123',
        'Maruti Swift VXI',
        '₹12,500',
        'DUE',
        'Due: 20-Jan-2025',
        'Call: +919462553887',
        'Pay on time - Finonest'
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
          template_name: 'demo',
          phone_number: TARGET_PHONE,
          parameters: scenario.params
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${scenario.name}: SUCCESS!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        break; // Stop after first successful send
      } else {
        console.log(`❌ ${scenario.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${scenario.name}: ${error.response?.data?.message || error.message}`);
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  await testDemoTemplate();
  await testLoanScenarios();
  
  console.log('\n📋 DEMO Template Structure:');
  console.log('{{1}} - Customer Name');
  console.log('{{2}} - Subject/Title');
  console.log('{{3}} - Loan ID');
  console.log('{{4}} - Vehicle Details');
  console.log('{{5}} - Amount/Documents');
  console.log('{{6}} - Status');
  console.log('{{7}} - Next Step/Action');
  console.log('{{8}} - Contact Info');
  console.log('{{9}} - Closing Message');
}

main();