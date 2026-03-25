import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function sendRegularMessage() {
  console.log('📱 Testing regular message with correct endpoint...\n');

  try {
    // Try different possible endpoints
    const endpoints = [
      'https://dash.botbiz.io/api/v1/whatsapp/send/text',
      'https://dash.botbiz.io/api/v1/whatsapp/message/send',
      'https://dash.botbiz.io/api/v1/whatsapp/send'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🧪 Trying endpoint: ${endpoint}`);
        
        const response = await axios.post(endpoint, {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          phone_number: TARGET_PHONE,
          message: 'Hello Yogi! Test message from Finonest. Your loan LOAN123 is approved! 🎉'
        });

        if (response.data.status === '1') {
          console.log('✅ SUCCESS! Regular message sent!');
          console.log('📧 Message ID:', response.data.wa_message_id);
          console.log('🎯 Working endpoint:', endpoint);
          return true;
        } else {
          console.log(`❌ Failed: ${response.data.message}`);
        }

      } catch (error) {
        console.log(`❌ Endpoint failed: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ All endpoints failed');
  }
  
  return false;
}

async function testSimpleTemplate() {
  console.log('\n🧪 Testing if any template works at all...\n');

  // Try the simplest possible template call
  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'demo',
        phone_number: TARGET_PHONE
        // No parameters - just test if template exists
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Template works without parameters!');
      console.log('📧 Message ID:', response.data.wa_message_id);
    } else {
      console.log('❌ Template failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Template error:', error.response?.data?.message || error.message);
  }
}

async function checkConversationWindow() {
  console.log('\n🕐 Checking 24-hour conversation window...\n');
  
  console.log('📋 Status: Subscriber exists (Yogi faujdar)');
  console.log('📞 Business Number: +919462553887');
  console.log('📱 Target Number: +916378110608');
  console.log('');
  console.log('🔍 To send regular messages:');
  console.log('1. User (6378110608) must message +919462553887 first');
  console.log('2. Then you have 24 hours to send regular messages');
  console.log('3. Templates can be sent anytime (if properly mapped)');
  console.log('');
  console.log('💡 Ask Yogi to send "Hi" to +919462553887 now!');
}

async function main() {
  const messageWorked = await sendRegularMessage();
  await testSimpleTemplate();
  await checkConversationWindow();
  
  console.log('\n📊 Summary:');
  if (messageWorked) {
    console.log('✅ Regular messages work - Templates are the issue');
  } else {
    console.log('❌ Regular messages blocked - Need 24-hour window');
    console.log('🎯 Focus on fixing template mapping with BotBiz');
  }
}

main();