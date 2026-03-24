import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function sendRegularMessage() {
  console.log('📱 Testing regular message (no template) to 6378110608...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/message',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        phone_number: TARGET_PHONE,
        message: 'Hello Yogi! This is a test message from Finonest Car Credit Hub. Your loan application LOAN123 is being processed. 🚗💰'
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Regular message sent successfully!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎯 Basic WhatsApp API is working!');
    } else {
      console.log('❌ Regular message failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error sending regular message:', error.response?.data?.message || error.message);
  }
}

async function checkSubscriberStatus() {
  console.log('👤 Checking subscriber status for 6378110608...\n');
  
  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/subscriber/get',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        phone_number: TARGET_PHONE
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Subscriber found!');
      console.log('📋 Details:', JSON.stringify(response.data.message[0], null, 2));
    } else {
      console.log('❌ Subscriber not found:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error checking subscriber:', error.response?.data?.message || error.message);
  }
}

async function sendLoanNotification() {
  console.log('\n🏦 Sending loan notification message...\n');

  const loanMessage = `🎉 *Loan Update - Finonest India*

Hello Yogi Faujdar!

Your loan application has been updated:
📋 Loan ID: LOAN123
🚗 Vehicle: Maruti Swift VXI
💰 Amount: ₹5,00,000
✅ Status: APPROVED

📄 Next Steps:
- Submit required documents
- Complete verification process

📞 Contact: +919462553887
🏢 Finonest India

Thank you for choosing us! 🙏`;

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/message',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        phone_number: TARGET_PHONE,
        message: loanMessage
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Loan notification sent successfully!');
      console.log('📧 Message ID:', response.data.wa_message_id);
    } else {
      console.log('❌ Loan notification failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error sending loan notification:', error.response?.data?.message || error.message);
  }
}

async function main() {
  await checkSubscriberStatus();
  await sendRegularMessage();
  await sendLoanNotification();
  
  console.log('\n📋 Test Results:');
  console.log('- If messages work: Templates are the issue');
  console.log('- If messages fail: Check 24-hour rule or API config');
  console.log('- 24-hour rule: User must message +919462553887 first');
}

main();