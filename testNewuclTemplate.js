import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testNewuclTemplate() {
  console.log('🧪 Testing NEWUCL template (ID: 277122) - APPROVED STATUS...\n');
  
  console.log('📋 Template Structure:');
  console.log('Hello! #LEAD_USER_FIRST_NAME#');
  console.log('');
  console.log('Your application for loan is under review. Here is your approved loan details.');
  console.log('Regis. No = #RegNo#');
  console.log('Car Model = #ModelNo#');
  console.log('Loan Amt. = #LoanAmt#');
  console.log('');
  console.log('Request you to please review and confirm.\n');

  // Test 1: Basic loan notification
  try {
    console.log('📤 Test 1: Basic loan notification...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'newucl',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',        // #LEAD_USER_FIRST_NAME#
          'MH12AB1234',          // #RegNo#
          'Maruti Swift VXI',    // #ModelNo#
          '₹5,00,000'           // #LoanAmt#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! NEWUCL template works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎊 Perfect for loan notifications!');
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Test 2: Different loan scenario
  try {
    console.log('\n📤 Test 2: Different loan scenario...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'newucl',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',        // #LEAD_USER_FIRST_NAME#
          'GJ01AB5678',          // #RegNo#
          'Honda City VX',       // #ModelNo#
          '₹7,50,000'           // #LoanAmt#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Second scenario works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Test 3: Without parameters (check if template exists)
  try {
    console.log('\n📤 Test 3: Template existence check...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'newucl',
        phone_number: TARGET_PHONE
        // No parameters
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Template exists and is mapped!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  return false;
}

async function testMultipleLoanScenarios() {
  console.log('\n🏦 Testing multiple loan scenarios with NEWUCL...\n');

  const scenarios = [
    {
      name: 'Car Loan - Swift',
      params: [
        'Yogi Faujdar',
        'MH12AB1234',
        'Maruti Swift VXI',
        '₹5,00,000'
      ]
    },
    {
      name: 'Car Loan - City',
      params: [
        'Yogi Faujdar',
        'GJ01CD5678',
        'Honda City VX',
        '₹7,50,000'
      ]
    },
    {
      name: 'Car Loan - Creta',
      params: [
        'Yogi Faujdar',
        'KA03EF9012',
        'Hyundai Creta SX',
        '₹12,00,000'
      ]
    },
    {
      name: 'Used Car Loan',
      params: [
        'Yogi Faujdar',
        'DL08GH3456',
        'Toyota Innova G4',
        '₹8,50,000'
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
          template_name: 'newucl',
          phone_number: TARGET_PHONE,
          parameters: scenario.params
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

    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function main() {
  console.log('🎯 NEWUCL Template Test\n');
  console.log('Template: newucl (ID: 277122)');
  console.log('Status: Approved ✅');
  console.log('Variables: 4 (#LEAD_USER_FIRST_NAME#, #RegNo#, #ModelNo#, #LoanAmt#)\n');
  
  const basicSuccess = await testNewuclTemplate();
  
  if (basicSuccess) {
    console.log('\n🎊 EXCELLENT! NEWUCL template is working!');
    console.log('🚀 Testing multiple loan scenarios...');
    await testMultipleLoanScenarios();
    
    console.log('\n📋 NEWUCL Template Usage:');
    console.log('#LEAD_USER_FIRST_NAME# - Customer Name');
    console.log('#RegNo# - Vehicle Registration Number');
    console.log('#ModelNo# - Vehicle Model');
    console.log('#LoanAmt# - Loan Amount');
    
    console.log('\n🎯 Perfect for Car Credit Hub loan notifications!');
  } else {
    console.log('\n⚠️ NEWUCL template still needs API enabling.');
    console.log('📋 Next steps:');
    console.log('1. Check if template is enabled for API sending in BotBiz');
    console.log('2. Ensure variables are properly mapped');
    console.log('3. Contact BotBiz support if needed');
  }
}

main();