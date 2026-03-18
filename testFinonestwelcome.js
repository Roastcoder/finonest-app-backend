import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TEMPLATE_ID = '336964';
const TARGET_PHONE = '917340522554';

async function testFinonestwelcomeTemplate() {
  console.log('🧪 Testing finonestwelcome template (ID: 336964)');
  console.log('📱 Phone: 7340522554\n');
  
  try {
    console.log('📤 Sending finonestwelcome template...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: TEMPLATE_ID,
        phone_number: TARGET_PHONE
      }
    );

    console.log('✅ SUCCESS! Template sent!');
    console.log('📧 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.wa_message_id) {
      console.log('📧 Message ID:', response.data.wa_message_id);
    }
    
  } catch (error) {
    console.error('❌ ERROR sending template:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }
}

// Alternative: Try with form data (as shown in curl example)
async function testWithFormData() {
  console.log('\n🔄 Trying with form data format...');
  
  try {
    const formData = new URLSearchParams();
    formData.append('apiToken', API_TOKEN);
    formData.append('phone_number_id', PHONE_NUMBER_ID);
    formData.append('template_id', TEMPLATE_ID);
    formData.append('phone_number', TARGET_PHONE);

    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ SUCCESS with form data!');
    console.log('📧 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.wa_message_id) {
      console.log('📧 Message ID:', response.data.wa_message_id);
    }
    
  } catch (error) {
    console.error('❌ ERROR with form data:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }
}

async function runTests() {
  await testFinonestwelcomeTemplate();
  await testWithFormData();
  
  console.log('\n💡 Template Details:');
  console.log('📋 Name: finonestwelcome');
  console.log('🆔 ID: 336964');
  console.log('📱 Phone: 917340522554');
  console.log('📝 Message: "Welcome to Finonest India.."');
}

runTests();