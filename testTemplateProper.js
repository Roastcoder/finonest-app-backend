import axios from 'axios';

// Test demo template with proper parameters
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TEST_PHONE = '916378110608';

async function testDemoTemplateWithParams() {
  console.log('🧪 Testing DEMO template with 9 parameters...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'demo',
        phone_number: TEST_PHONE,
        parameters: [
          'Yogi Faujdar',              // {{1}} - Customer name
          '🎉 Loan Approved!',         // {{2}} - Subject/Title
          'LOAN123',                   // {{3}} - Loan ID
          'Maruti Swift VXI',          // {{4}} - Vehicle details
          '₹5,00,000',                // {{5}} - Loan amount
          'APPROVED',                  // {{6}} - Current status
          'Documentation process',      // {{7}} - Next action
          'Call: +919462553887',       // {{8}} - Contact info
          'Congratulations - Finonest' // {{9}} - Closing message
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ DEMO template sent successfully!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('\n🎉 SUCCESS! Your demo template works perfectly!');
      console.log('You can now use it for all loan notifications.');
    } else {
      console.log('❌ DEMO template failed:', response.data.message);
      
      if (response.data.message.includes('24 hour')) {
        console.log('\n💡 SOLUTION: Ask Yogi (6378110608) to send any message to +919462553887 first');
        console.log('Then you can send template messages for 24 hours');
      }
    }
  } catch (error) {
    console.error('❌ Error testing DEMO template:', error.response?.data?.message || error.message);
    
    if (error.response?.data?.message?.includes('template not found')) {
      console.log('\n🔍 Checking if template exists...');
      await checkTemplateExists();
    }
  }
}

async function checkTemplateExists() {
  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/template/list',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID
      }
    );

    if (response.data.status === '1' && response.data.message) {
      const templates = Array.isArray(response.data.message) ? response.data.message : [response.data.message];
      const demoTemplate = templates.find(t => t.template_name === 'demo');
      
      if (demoTemplate) {
        console.log('✅ DEMO template exists in your account');
        console.log('Status:', demoTemplate.status);
        console.log('Category:', demoTemplate.template_category);
        console.log('Variables in body:', (demoTemplate.body_content.match(/\{\{\d+\}\}/g) || []).length);
        
        if (demoTemplate.status !== 'Approved') {
          console.log('⚠️  Template status is not "Approved" - this might be why it failed');
        }
      } else {
        console.log('❌ DEMO template not found in your account');
      }
    }
  } catch (error) {
    console.error('Error checking template:', error.message);
  }
}

// Test other working templates
async function testWorkingTemplates() {
  console.log('🧪 Testing other approved templates...\n');

  const templatesToTest = [
    { name: 'data_rc', params: ['Yogi', 'SR123', 'MH12AB1234', 'Swift', 'Maruti', '2020', 'Mumbai'] },
    { name: 'testing', params: ['Yogi Faujdar', 'Loan approved', 'Amount: ₹5,00,000', 'Contact: +919462553887'] },
    { name: 'promo_offer', params: [] }, // No parameters
    { name: 'new_year_greetings', params: [] } // No parameters
  ];

  for (const template of templatesToTest) {
    try {
      console.log(`📤 Testing: ${template.name}`);
      
      const requestBody = {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: template.name,
        phone_number: TEST_PHONE
      };

      if (template.params.length > 0) {
        requestBody.parameters = template.params;
      }

      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        requestBody
      );

      if (response.data.status === '1') {
        console.log(`✅ ${template.name}: SUCCESS`);
      } else {
        console.log(`❌ ${template.name}: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${template.name}: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
}

// Main function
async function main() {
  const action = process.argv[2];

  switch (action) {
    case 'demo':
      await testDemoTemplateWithParams();
      break;
    case 'all':
      await testWorkingTemplates();
      break;
    default:
      console.log('🧪 Template Testing Tool\n');
      console.log('Commands:');
      console.log('  node testTemplateProper.js demo  - Test DEMO template with parameters');
      console.log('  node testTemplateProper.js all   - Test all approved templates');
      console.log('');
      console.log('🎯 Quick start: node testTemplateProper.js demo');
  }
}

main();