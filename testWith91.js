import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TEMPLATE_ID = '336964';
const TARGET_PHONE = '917340522554'; // Using 91 country code

async function testWith91CountryCode() {
  console.log('🧪 Testing finonestwelcome template with 91 country code');
  console.log('📱 Phone: 917340522554\n');
  
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

    console.log('✅ SUCCESS! Template sent with 91 format!');
    console.log('📧 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.wa_message_id) {
      console.log('📧 Message ID:', response.data.wa_message_id);
      
      // Check status after a moment
      setTimeout(async () => {
        await checkMessageStatus(response.data.wa_message_id);
      }, 3000);
    }
    
  } catch (error) {
    console.error('❌ ERROR sending template:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

async function checkMessageStatus(messageId) {
  console.log('\n🔍 Checking delivery status...');
  
  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/get/message-status',
      {
        apiToken: API_TOKEN,
        wa_message_id: messageId,
        whatsapp_bot_id: PHONE_NUMBER_ID
      }
    );

    console.log('📊 Status:', JSON.stringify(response.data, null, 2));
    
    if (response.data.message?.message_status === 'delivered') {
      console.log('✅ Message DELIVERED successfully!');
    } else if (response.data.message?.message_status === 'failed') {
      console.log('❌ Message FAILED to deliver');
    } else {
      console.log('⏳ Message status:', response.data.message?.message_status || 'pending');
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error.response?.data || error.message);
  }
}

// Test multiple formats with 91
async function testMultiple91Formats() {
  console.log('\n🧪 Testing multiple 91 formats...\n');
  
  const formats = [
    '917340522554',    // Standard 91 format
    '91 7340522554',   // With space
    '+917340522554'    // With plus
  ];

  for (const phone of formats) {
    try {
      console.log(`📱 Testing: ${phone}`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: TEMPLATE_ID,
          phone_number: phone
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ SUCCESS with ${phone}!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}\n`);
      } else {
        console.log(`❌ Failed: ${response.data.message}\n`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}\n`);
    }
  }
}

async function runTest() {
  await testWith91CountryCode();
  await testMultiple91Formats();
  
  console.log('\n💡 Using 91 country code format for India');
  console.log('📱 Format: 917340522554');
  console.log('📋 Template: finonestwelcome (ID: 336964)');
  console.log('📝 Message: "Welcome to Finonest India.."');
}

runTest();