import axios from 'axios';

// Quick test script for BotBiz WhatsApp API
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const BUSINESS_PHONE = '919462553887';
const TEST_PHONE = '917357302124';

async function testBotBizAPI() {
  console.log('🧪 Testing BotBiz WhatsApp API...\n');

  // Test 1: Send a simple message
  try {
    console.log('📱 Sending test message to', TEST_PHONE);
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        message: '🏦 *Finonest India - WhatsApp Integration Test*\n\n✅ API Token: Working\n✅ Phone Number ID: 716044761593234\n✅ Business Number: +919462553887\n\n🎉 Your loan management system is now connected to WhatsApp!\n\n📋 Ready Features:\n• Loan notifications\n• Document sharing\n• Customer updates\n• Staff notifications\n\nThank you for choosing Finonest India! 🚀',
        phone_number: TEST_PHONE
      }
    );

    console.log('✅ Message sent successfully!');
    console.log('Response:', response.data);
    
    if (response.data.wa_message_id) {
      console.log('📧 Message ID:', response.data.wa_message_id);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data?.message?.includes('phone_number_id')) {
      console.log('\n💡 Tip: You need to set BOTBIZ_PHONE_NUMBER_ID in your .env file');
      console.log('Get it from your BotBiz dashboard');
    }
  }
}

// Run the test
if (process.argv[2] === 'test') {
  testBotBizAPI();
} else {
  console.log('Usage: node quickTest.js test');
}

export { testBotBizAPI };