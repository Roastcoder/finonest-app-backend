import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testFinodemoWithCreatedVariables() {
  console.log('🧪 Testing FINODEMO template with your created variables...\n');
  
  console.log('📋 Template Structure:');
  console.log('Hello #username#');
  console.log('#1#');
  console.log('#2#');
  console.log('#3#');
  console.log('#4#');
  console.log('#5#');
  console.log('#6#');
  console.log('#7#');
  console.log('You can check the details below for your convenience.');
  console.log('#8#');
  console.log('🙂 Thanks for taking a moment to read this message.\n');

  // Test 1: Loan Approval Notification
  try {
    console.log('📤 Test 1: Loan Approval Notification...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // #username#
          '🎉 Loan Approved!',         // #1#
          'Loan ID: LOAN123',          // #2#
          'Vehicle: Maruti Swift VXI', // #3#
          'Amount: ₹5,00,000',        // #4#
          'Status: APPROVED',          // #5#
          'Next: Submit documents',    // #6#
          'Contact: +919462553887',    // #7#
          'Congratulations - Finonest India!' // #8#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Loan approval sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎊 FINODEMO template is working perfectly!');
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Test 2: Document Request
  try {
    console.log('\n📤 Test 2: Document Request...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // #username#
          '📄 Documents Required',     // #1#
          'Loan ID: LOAN123',          // #2#
          'Vehicle: Maruti Swift VXI', // #3#
          'Documents: PAN, Aadhar',    // #4#
          'Status: PENDING',           // #5#
          'Timeline: 3 days',          // #6#
          'Contact: +919462553887',    // #7#
          'Please submit soon - Finonest India!' // #8#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Document request sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Test 3: EMI Reminder
  try {
    console.log('\n📤 Test 3: EMI Reminder...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // #username#
          '💰 EMI Reminder',           // #1#
          'Loan ID: LOAN123',          // #2#
          'Vehicle: Maruti Swift VXI', // #3#
          'EMI Amount: ₹12,500',      // #4#
          'Status: DUE',               // #5#
          'Due Date: 20-Jan-2025',     // #6#
          'Contact: +919462553887',    // #7#
          'Pay on time - Finonest India!' // #8#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! EMI reminder sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Test 4: RC Verification
  try {
    console.log('\n📤 Test 4: RC Verification...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // #username#
          '🚗 RC Verification',        // #1#
          'Service ID: LOAN123',       // #2#
          'Reg No: MH12AB1234',       // #3#
          'Model: Maruti Swift VXI',   // #4#
          'Maker: Maruti Suzuki',      // #5#
          'RTO: Mumbai RTO',           // #6#
          'Contact: +919462553887',    // #7#
          'Please confirm details - Finonest India!' // #8#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! RC verification sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  return false;
}

async function main() {
  console.log('🎯 FINODEMO Template Test with Created Variables\n');
  console.log('Variables: #username#, #1#, #2#, #3#, #4#, #5#, #6#, #7#, #8#\n');
  
  const success = await testFinodemoWithCreatedVariables();
  
  if (success) {
    console.log('\n🎊 EXCELLENT! FINODEMO template is working!');
    console.log('🚀 You can now use this template for all Car Credit Hub notifications!');
    console.log('\n📋 Template Usage:');
    console.log('#username# - Customer Name');
    console.log('#1# - Subject/Title');
    console.log('#2# - Loan ID');
    console.log('#3# - Vehicle Details');
    console.log('#4# - Amount/Description');
    console.log('#5# - Status');
    console.log('#6# - Next Step/Timeline');
    console.log('#7# - Contact Information');
    console.log('#8# - Closing Message');
  } else {
    console.log('\n⚠️ Template still not working. Possible issues:');
    console.log('1. Template not enabled for API sending');
    console.log('2. Variables not properly mapped');
    console.log('3. Template needs approval from WhatsApp');
    console.log('\n💡 Contact BotBiz support to enable API access for finodemo template');
  }
}

main();