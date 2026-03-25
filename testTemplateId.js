import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testWithTemplateId() {
  console.log('🧪 Testing templates using template_id (BotBiz API format)...\n');

  const templates = [
    {
      name: 'demo',
      id: '313823',
      description: 'DEMO template - 9 variables',
      params: [
        'Yogi Faujdar',              // {{1}}
        '🎉 Loan Approved!',         // {{2}}
        'LOAN123',                   // {{3}}
        'Maruti Swift VXI',          // {{4}}
        '₹5,00,000',                // {{5}}
        'APPROVED',                  // {{6}}
        'Documentation needed',       // {{7}}
        'Call: +919462553887',       // {{8}}
        'Congratulations - Finonest' // {{9}}
      ]
    },
    {
      name: 'finodemo',
      id: '336920',
      description: 'FINODEMO template - 9 variables',
      params: [
        'Yogi Faujdar',              // #username#
        '🎉 Loan Approved!',         // #1#
        'Loan ID: LOAN123',          // #2#
        'Vehicle: Maruti Swift VXI', // #3#
        'Amount: ₹5,00,000',        // #4#
        'Status: APPROVED',          // #5#
        'Next: Submit documents',    // #6#
        'Contact: +919462553887',    // #7#
        'Congratulations - Finonest!' // #8#
      ]
    },
    {
      name: 'newucl',
      id: '277122',
      description: 'NEWUCL template - 4 variables',
      params: [
        'Yogi Faujdar',        // #LEAD_USER_FIRST_NAME#
        'MH12AB1234',          // #RegNo#
        'Maruti Swift VXI',    // #ModelNo#
        '₹5,00,000'           // #LoanAmt#
      ]
    },
    {
      name: 'data_rc',
      id: '278831',
      description: 'DATA_RC template - 7 variables',
      params: [
        'Yogi Faujdar',        // {{1}}
        'LOAN123',             // {{2}}
        'MH12AB1234',          // {{3}}
        'Maruti Swift VXI',    // {{4}}
        'Maruti Suzuki',       // {{5}}
        '15-Jan-2020',         // {{6}}
        'Mumbai RTO'           // {{7}}
      ]
    },
    {
      name: 'testing',
      id: '313821',
      description: 'TESTING template - 4 variables',
      params: [
        'Yogi Faujdar',
        '🎉 Loan Approved!',
        'LOAN123',
        'Maruti Swift VXI'
      ]
    }
  ];

  for (const template of templates) {
    try {
      console.log(`🧪 Testing: ${template.name} (ID: ${template.id}) - ${template.description}`);
      
      // Method 1: Using template_id with parameters
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: template.id,
          phone_number: TARGET_PHONE,
          parameters: template.params
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${template.name}: SUCCESS with template_id!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        console.log('🎊 Template ID method works!');
        return { success: true, workingTemplate: template.name, method: 'template_id' };
      } else {
        console.log(`❌ ${template.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${template.name}: ${error.response?.data?.message || error.message}`);
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { success: false };
}

async function testWithFormData() {
  console.log('\n🧪 Testing with form-data format (like curl example)...\n');

  try {
    console.log('📤 Testing DEMO template with form-data...');
    
    // Using URLSearchParams to mimic form-data
    const formData = new URLSearchParams();
    formData.append('apiToken', API_TOKEN);
    formData.append('phone_number_id', PHONE_NUMBER_ID);
    formData.append('template_id', '313823'); // DEMO template
    formData.append('phone_number', TARGET_PHONE);
    formData.append('parameters', JSON.stringify([
      'Yogi Faujdar',
      '🎉 Loan Approved!',
      'LOAN123',
      'Maruti Swift VXI',
      '₹5,00,000',
      'APPROVED',
      'Documentation needed',
      'Call: +919462553887',
      'Congratulations - Finonest'
    ]));

    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS with form-data format!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return { success: true, method: 'form-data' };
    } else {
      console.log('❌ Form-data failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Form-data error:', error.response?.data?.message || error.message);
  }

  return { success: false };
}

async function testSimpleTemplateCall() {
  console.log('\n🧪 Testing simple template call without parameters...\n');

  const templates = [
    { name: 'demo', id: '313823' },
    { name: 'finodemo', id: '336920' },
    { name: 'newucl', id: '277122' }
  ];

  for (const template of templates) {
    try {
      console.log(`📤 Testing ${template.name} without parameters...`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: template.id,
          phone_number: TARGET_PHONE
          // No parameters
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${template.name}: SUCCESS without parameters!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        return { success: true, workingTemplate: template.name, method: 'simple' };
      } else {
        console.log(`❌ ${template.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${template.name}: ${error.response?.data?.message || error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { success: false };
}

async function main() {
  console.log('🎯 Testing Templates with Correct BotBiz API Format\n');
  console.log('📋 Using template_id instead of template_name\n');

  // Test 1: With template_id and parameters
  const result1 = await testWithTemplateId();
  
  if (result1.success) {
    console.log(`\n🎊 SUCCESS! ${result1.workingTemplate} template works with ${result1.method}!`);
    console.log('🚀 Templates are now functional for Car Credit Hub!');
    return;
  }

  // Test 2: With form-data format
  const result2 = await testWithFormData();
  
  if (result2.success) {
    console.log(`\n🎊 SUCCESS! Templates work with ${result2.method} format!`);
    console.log('🚀 Templates are now functional for Car Credit Hub!');
    return;
  }

  // Test 3: Simple template call
  const result3 = await testSimpleTemplateCall();
  
  if (result3.success) {
    console.log(`\n🎊 SUCCESS! ${result3.workingTemplate} works with ${result3.method} method!`);
    console.log('🚀 Templates are now functional for Car Credit Hub!');
    return;
  }

  console.log('\n⚠️ All template methods failed.');
  console.log('📋 Possible solutions:');
  console.log('1. Templates need to be enabled in HTTP API Integration');
  console.log('2. Wait for template approval/mapping to take effect');
  console.log('3. Contact BotBiz support for manual enabling');
  console.log('\n💡 Continue using regular messages - they work perfectly!');
}

main();