import axios from 'axios';

// Send test message to specific number
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608'; // Added country code 91

async function sendTestMessage() {
  console.log('📱 Sending test message to 6378110608...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        message: `🏦 *Finonest India - Loan Management System*

🎉 Hello! This is a test message from Finonest India.

✅ WhatsApp Business API is working perfectly!
✅ Ready to send loan notifications
✅ Ready to share documents with attachments
✅ Ready to provide customer support

📋 Our Services:
• Vehicle Loan Processing
• Document Management
• EMI Calculations
• Loan Status Updates

📞 Contact: +919462553887
🌐 Powered by Finonest India

Thank you for connecting with us! 🚀`,
        phone_number: TARGET_PHONE
      }
    );

    console.log('✅ Message sent successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.wa_message_id) {
      console.log('📧 WhatsApp Message ID:', response.data.wa_message_id);
    }

    if (response.data.status === '1') {
      console.log('🎯 Status: Message delivered to WhatsApp servers');
    }
    
  } catch (error) {
    console.error('❌ Failed to send message:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('📋 Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
sendTestMessage();