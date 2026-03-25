import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const MESSAGE_ID = 'wamid.HBgMOTE3MzQwNTIyNTU0FQIAERgSNkIxMzEyNTZDRDk5NjgyMDk4AA==';

async function checkMessageStatus() {
  console.log('🔍 Checking message delivery status...\n');
  
  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/get/message-status',
      {
        apiToken: API_TOKEN,
        wa_message_id: MESSAGE_ID,
        whatsapp_bot_id: PHONE_NUMBER_ID
      }
    );

    console.log('📊 Message Status:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking status:', error.response?.data || error.message);
  }
}

async function tryDifferentFormats() {
  console.log('\n🧪 Trying different phone number formats...\n');
  
  const phoneFormats = [
    '7340522554',      // Without country code
    '+917340522554',   // With + prefix
    '917340522554',    // With country code
    '91 7340522554'    // With space
  ];

  for (const phone of phoneFormats) {
    try {
      console.log(`📱 Trying: ${phone}`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: '336964',
          phone_number: phone
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ SUCCESS with ${phone}!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}\n`);
        break;
      } else {
        console.log(`❌ Failed with ${phone}: ${response.data.message}\n`);
      }
      
    } catch (error) {
      console.log(`❌ Error with ${phone}: ${error.response?.data?.message || error.message}\n`);
    }
  }
}

async function checkSubscriber() {
  console.log('👤 Checking if user is a subscriber...\n');
  
  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/subscriber/get',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        phone_number: '917340522554'
      }
    );

    console.log('👤 Subscriber Info:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Subscriber check failed:', error.response?.data || error.message);
  }
}

async function runDiagnostics() {
  await checkMessageStatus();
  await checkSubscriber();
  await tryDifferentFormats();
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('1. Ask the user (7340522554) to send "Hi" to +919462553887 first');
  console.log('2. Wait for user to initiate conversation, then send template');
  console.log('3. Check if WhatsApp is installed on that number');
  console.log('4. Verify the number is active and not blocked');
  console.log('\n📞 Your WhatsApp Business Number: +919462553887');
}

runDiagnostics();