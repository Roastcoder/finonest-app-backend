import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function sendRegularMessage() {
  console.log('📱 Testing regular message using correct endpoint...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        phone_number: TARGET_PHONE,
        message: 'Hello Yogi! 🎉 Your loan application LOAN123 has been APPROVED! Amount: ₹5,00,000 for Maruti Swift VXI. Next step: Submit documents. Call: +919462553887. Congratulations from Finonest India! 🚗💰'
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Regular message sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎯 Regular messaging works perfectly!');
      return true;
    } else {
      console.log('❌ Message failed:', response.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function sendLoanNotifications() {
  console.log('\n🏦 Testing different loan notification messages...\n');

  const notifications = [
    {
      type: 'Loan Approval',
      message: '🎉 LOAN APPROVED! Hello Yogi, your loan LOAN123 for ₹5,00,000 (Maruti Swift VXI) is APPROVED! Next: Submit documents. Call: +919462553887. Congratulations - Finonest India! 🚗'
    },
    {
      type: 'Document Request',
      message: '📄 DOCUMENTS NEEDED! Hello Yogi, for loan LOAN123 (Maruti Swift VXI), please submit: PAN, Aadhar, Salary Slip within 3 days. Call: +919462553887. Upload soon - Finonest India!'
    },
    {
      type: 'EMI Reminder',
      message: '💰 EMI REMINDER! Hello Yogi, your EMI of ₹12,500 for loan LOAN123 (Maruti Swift VXI) is due on 20-Jan-2025. Pay on time. Call: +919462553887. Finonest India 🏦'
    }
  ];

  for (const notification of notifications) {
    try {
      console.log(`🧪 Sending: ${notification.type}`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          phone_number: TARGET_PHONE,
          message: notification.message
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${notification.type}: SUCCESS!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        break; // Stop after first successful send
      } else {
        console.log(`❌ ${notification.type}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${notification.type}: ${error.response?.data?.message || error.message}`);
    }

    // Wait 3 seconds between messages
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function getConversation() {
  console.log('\n💬 Getting conversation history...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/get/conversation',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        phone_number: TARGET_PHONE,
        limit: 5,
        offset: 0
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Conversation retrieved!');
      console.log('📋 Recent messages:', response.data.message.length);
      
      response.data.message.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.sender}: ${msg.conversation_time}`);
      });
    } else {
      console.log('❌ Conversation failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Conversation error:', error.response?.data?.message || error.message);
  }
}

async function main() {
  const messageWorked = await sendRegularMessage();
  
  if (messageWorked) {
    console.log('\n🎯 Regular messages work! Now testing loan notifications...');
    await sendLoanNotifications();
  } else {
    console.log('\n⚠️ Regular messages blocked - 24-hour rule applies');
    console.log('📞 Ask Yogi (6378110608) to message +919462553887 first');
  }
  
  await getConversation();
  
  console.log('\n📊 FINAL RESULT:');
  if (messageWorked) {
    console.log('✅ WhatsApp API works perfectly for regular messages!');
    console.log('🎯 You can send loan notifications without templates!');
    console.log('💡 Templates are optional - regular messages work fine!');
  } else {
    console.log('❌ Need 24-hour conversation window');
    console.log('🔧 Focus on template mapping as backup solution');
  }
}

main();