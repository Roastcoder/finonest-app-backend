import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testFinonestdemoAgain() {
  console.log('🧪 Testing FINONESTDEMO template (ID: 336962) - Status: Pending...\n');
  
  console.log('📋 Template: finonestdemo');
  console.log('📋 ID: 336962');
  console.log('📋 Status: Pending (Updated)');
  console.log('📋 Category: Marketing\n');

  // Test 1: Basic test with template_id
  try {
    console.log('📤 Test 1: Using template_id with basic parameters...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336962', // FINONESTDEMO template
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // {{1}}
          '🎉 Loan Approved!',         // {{2}}
          'LOAN123',                   // {{3}}
          'Maruti Swift VXI'           // {{4}}
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! FINONESTDEMO template_id works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎊 Template is now functional!');
      return { success: true, method: 'template_id_basic' };
    } else {
      console.log('❌ Template_id basic failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Template_id basic error:', error.response?.data?.message || error.message);
  }

  // Test 2: With 9 parameters (like finodemo)
  try {
    console.log('\n📤 Test 2: With 9 parameters...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336962',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // {{1}}
          '🎉 Loan Approved!',         // {{2}}
          'Loan ID: LOAN123',          // {{3}}
          'Vehicle: Maruti Swift VXI', // {{4}}
          'Amount: ₹5,00,000',        // {{5}}
          'Status: APPROVED',          // {{6}}
          'Next: Submit documents',    // {{7}}
          'Contact: +919462553887',    // {{8}}
          'Congratulations - Finonest!' // {{9}}
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! FINONESTDEMO with 9 parameters works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return { success: true, method: '9_parameters' };
    } else {
      console.log('❌ 9 parameters failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ 9 parameters error:', error.response?.data?.message || error.message);
  }

  // Test 3: Without parameters
  try {
    console.log('\n📤 Test 3: Without parameters...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336962',
        phone_number: TARGET_PHONE
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! FINONESTDEMO without parameters works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return { success: true, method: 'no_parameters' };
    } else {
      console.log('❌ No parameters failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ No parameters error:', error.response?.data?.message || error.message);
  }

  // Test 4: Using template_name
  try {
    console.log('\n📤 Test 4: Using template_name...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finonestdemo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',
          '🎉 Loan Approved!',
          'LOAN123',
          'Maruti Swift VXI'
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! FINONESTDEMO with template_name works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return { success: true, method: 'template_name' };
    } else {
      console.log('❌ Template_name failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Template_name error:', error.response?.data?.message || error.message);
  }

  // Test 5: Different parameter combinations
  const parameterTests = [
    {
      name: '1 parameter',
      params: ['Yogi Faujdar']
    },
    {
      name: '2 parameters',
      params: ['Yogi Faujdar', '🎉 Loan Approved!']
    },
    {
      name: '3 parameters',
      params: ['Yogi Faujdar', '🎉 Loan Approved!', 'LOAN123']
    },
    {
      name: '5 parameters',
      params: ['Yogi Faujdar', '🎉 Loan Approved!', 'LOAN123', 'Maruti Swift VXI', '₹5,00,000']
    }
  ];

  for (const test of parameterTests) {
    try {
      console.log(`\n📤 Test: ${test.name}...`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: '336962',
          phone_number: TARGET_PHONE,
          parameters: test.params
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ SUCCESS! ${test.name} works!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        return { success: true, method: test.name };
      } else {
        console.log(`❌ ${test.name} failed: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${test.name} error: ${error.response?.data?.message || error.message}`);
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { success: false };
}

async function main() {
  console.log('🎯 Re-testing FINONESTDEMO Template (Status: Pending)\n');
  
  const result = await testFinonestdemoAgain();
  
  if (result.success) {
    console.log(`\n🎊 EXCELLENT! FINONESTDEMO template now works with ${result.method}!`);
    console.log('🚀 Template status changed from not working to functional!');
    
    console.log('\n📋 Updated Template Status:');
    console.log('✅ finonestdemo (ID: 336962) - NOW WORKING');
    console.log('✅ finodemo (ID: 336920) - Already working');
    console.log('✅ Regular messages - Always working');
    
    console.log('\n🎯 You now have multiple working templates for Car Credit Hub!');
    console.log('💡 Consider updating your service to use the new finonestdemo template');
  } else {
    console.log('\n⚠️ FINONESTDEMO template still not working.');
    console.log('📋 Status: Pending - may need more time for approval');
    console.log('📋 Possible reasons:');
    console.log('1. Template still under WhatsApp review');
    console.log('2. Variables not mapped yet');
    console.log('3. API access not enabled');
    
    console.log('\n💡 Your existing solutions still work perfectly:');
    console.log('• finodemo template (ID: 336920) - Working');
    console.log('• Regular messages - Always working');
    console.log('• Smart sending system - Fully functional');
    
    console.log('\n🎯 Continue using your current working system!');
  }
}

main();