import axios from 'axios';

// Send approved template message
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function sendPromoTemplate() {
  console.log('🎉 Sending PROMO_OFFER template to 6378110608...\n');

  try {
    // Send the approved promo_offer template
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'promo_offer',
        phone_number: TARGET_PHONE
      }
    );

    console.log('✅ Promo template sent successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.wa_message_id) {
      console.log('📧 WhatsApp Message ID:', response.data.wa_message_id);
    }

  } catch (error) {
    console.error('❌ Failed to send promo template:', error.response?.data || error.message);
    
    // Try the new_year_greetings template as backup
    try {
      console.log('🔄 Trying new_year_greetings template...');
      
      const backupResponse = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_name: 'new_year_greetings',
          phone_number: TARGET_PHONE
        }
      );

      console.log('✅ New Year template sent successfully!');
      console.log('📊 Response:', JSON.stringify(backupResponse.data, null, 2));
      
    } catch (backupError) {
      console.error('❌ Backup template also failed:', backupError.response?.data || backupError.message);
    }
  }
}

// Also try to send a simple message (in case 24-hour window is open)
async function trySimpleMessage() {
  console.log('📱 Trying simple message (if 24-hour window is open)...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        message: `🏦 *Finonest India - Test Message*

Hello Yogi! 👋

This is a test message from Finonest India's loan management system.

✅ WhatsApp Business API is working
✅ Your number: 6378110608 is in our system
✅ Ready to send loan notifications

📞 Business Number: +919462553887
🌐 Powered by Finonest India

Thank you! 🚀`,
        phone_number: TARGET_PHONE
      }
    );

    console.log('✅ Simple message sent successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('ℹ️ Simple message failed (expected - 24-hour rule):', error.response?.data?.message || error.message);
  }
}

// Run both attempts
async function runTest() {
  await sendPromoTemplate();
  console.log('\n' + '='.repeat(50) + '\n');
  await trySimpleMessage();
  
  console.log('\n📋 Summary:');
  console.log('• Subscriber found: Yogi faujdar (916378110608)');
  console.log('• Available templates: promo_offer, new_year_greetings, data_rc, etc.');
  console.log('• For regular messages: Ask Yogi to message +919462553887 first');
}

runTest();