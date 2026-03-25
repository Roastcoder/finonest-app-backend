import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testFinonestdemoTemplate() {
  console.log('🧪 Testing FINONESTDEMO template (ID: 336962)...\n');
  
  console.log('📋 Template: finonestdemo');
  console.log('📋 ID: 336962');
  console.log('📋 Category: Marketing\n');

  // Test 1: With parameters (assuming similar structure to finodemo)
  try {
    console.log('📤 Test 1: With 9 parameters (like finodemo)...');
    
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
      console.log('🎊 New template is functional!');
      return { success: true, method: '9_parameters' };
    } else {
      console.log('❌ 9 parameters failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ 9 parameters error:', error.response?.data?.message || error.message);
  }

  // Test 2: With fewer parameters
  try {
    console.log('\n📤 Test 2: With 4 parameters...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336962',
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
      console.log('✅ SUCCESS! FINONESTDEMO with 4 parameters works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return { success: true, method: '4_parameters' };
    } else {
      console.log('❌ 4 parameters failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ 4 parameters error:', error.response?.data?.message || error.message);
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

  // Test 4: Using template_name instead of template_id
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

  return { success: false };
}

async function testDifferentLoanScenarios() {
  console.log('\n🏦 Testing different loan scenarios with FINONESTDEMO...\n');

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
        'Submit documents',
        '+919462553887',
        'Congratulations!'
      ]
    },
    {
      name: 'Document Request',
      params: [
        'Yogi Faujdar',
        '📄 Documents Required',
        'LOAN123',
        'Maruti Swift VXI',
        'PAN, Aadhar',
        'PENDING',
        '3 days timeline',
        '+919462553887',
        'Submit soon'
      ]
    },
    {
      name: 'EMI Reminder',
      params: [
        'Yogi Faujdar',
        '💰 EMI Due',
        'LOAN123',
        'Maruti Swift VXI',
        '₹12,500',
        'DUE',
        '20-Jan-2025',
        '+919462553887',
        'Pay on time'
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
          template_id: '336962',
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
  console.log('🎯 Testing New FINONESTDEMO Template\n');
  console.log('Template: finonestdemo');
  console.log('ID: 336962');
  console.log('Category: Marketing\n');
  
  const result = await testFinonestdemoTemplate();
  
  if (result.success) {
    console.log(`\n🎊 EXCELLENT! FINONESTDEMO template works with ${result.method}!`);
    console.log('🚀 Testing different loan scenarios...');
    await testDifferentLoanScenarios();
    
    console.log('\n📋 FINONESTDEMO Template Status:');
    console.log('✅ Template is functional');
    console.log('✅ Can be used for loan notifications');
    console.log('✅ Ready for Car Credit Hub integration');
    
    console.log('\n🎯 You now have multiple working templates:');
    console.log('• finodemo (ID: 336920) - Working');
    console.log('• finonestdemo (ID: 336962) - Working');
    console.log('• Regular messages - Always working');
  } else {
    console.log('\n⚠️ FINONESTDEMO template needs configuration.');
    console.log('📋 Possible issues:');
    console.log('1. Template not approved yet');
    console.log('2. Variables not mapped correctly');
    console.log('3. API access not enabled');
    
    console.log('\n💡 Continue using your working solutions:');
    console.log('• finodemo template (works)');
    console.log('• Regular messages (always work)');
  }
}

main();