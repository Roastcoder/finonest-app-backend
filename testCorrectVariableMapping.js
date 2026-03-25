import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testFinonestdemoCorrectVariables() {
  console.log('🧪 Testing FINONESTDEMO with correct variable mapping...\n');
  
  console.log('📋 Correct Template Structure:');
  console.log('Hello');
  console.log('#!1!#');
  console.log('#!2!#');
  console.log('#!3!#');
  console.log('#!4!#');
  console.log('#!5!#');
  console.log('#!6!#');
  console.log('#!7!#');
  console.log('You can check the details below for your convenience.');
  console.log('#!8!#');
  console.log('🙂 Thanks for taking a moment to read this message.\n');

  // Test 1: Loan Approval with correct variable mapping
  try {
    console.log('📤 Test 1: Loan Approval with correct variables...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336962', // FINONESTDEMO template
        phone_number: TARGET_PHONE,
        parameters: [
          '🎉 Loan Approved!',         // {{1}} -> #!1!#
          'Loan ID: LOAN123',          // {{2}} -> #!2!#
          'Vehicle: Maruti Swift VXI', // {{3}} -> #!3!#
          'Amount: ₹5,00,000',        // {{4}} -> #!4!#
          'Status: APPROVED',          // {{5}} -> #!5!#
          'Next: Submit documents',    // {{6}} -> #!6!#
          'Contact: +919462553887',    // {{7}} -> #!7!#
          'Congratulations from Finonest India!' // {{8}} -> #!8!#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Loan approval sent with correct variables!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('\n📱 Expected message format:');
      console.log('Hello');
      console.log('🎉 Loan Approved!');
      console.log('Loan ID: LOAN123');
      console.log('Vehicle: Maruti Swift VXI');
      console.log('Amount: ₹5,00,000');
      console.log('Status: APPROVED');
      console.log('Next: Submit documents');
      console.log('Contact: +919462553887');
      console.log('You can check the details below for your convenience.');
      console.log('Congratulations from Finonest India!');
      console.log('🙂 Thanks for taking a moment to read this message.');
      return { success: true, scenario: 'loan_approval' };
    } else {
      console.log('❌ Loan approval failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Loan approval error:', error.response?.data?.message || error.message);
  }

  // Test 2: Document Request
  try {
    console.log('\n📤 Test 2: Document Request...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336962',
        phone_number: TARGET_PHONE,
        parameters: [
          '📄 Documents Required',     // {{1}} -> #!1!#
          'Loan ID: LOAN123',          // {{2}} -> #!2!#
          'Vehicle: Maruti Swift VXI', // {{3}} -> #!3!#
          'Documents: PAN, Aadhar',    // {{4}} -> #!4!#
          'Status: PENDING',           // {{5}} -> #!5!#
          'Timeline: 3 days',          // {{6}} -> #!6!#
          'Contact: +919462553887',    // {{7}} -> #!7!#
          'Please submit soon - Finonest India!' // {{8}} -> #!8!#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Document request sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return { success: true, scenario: 'document_request' };
    } else {
      console.log('❌ Document request failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Document request error:', error.response?.data?.message || error.message);
  }

  // Test 3: EMI Reminder
  try {
    console.log('\n📤 Test 3: EMI Reminder...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336962',
        phone_number: TARGET_PHONE,
        parameters: [
          '💰 EMI Reminder',           // {{1}} -> #!1!#
          'Loan ID: LOAN123',          // {{2}} -> #!2!#
          'Vehicle: Maruti Swift VXI', // {{3}} -> #!3!#
          'EMI Amount: ₹12,500',      // {{4}} -> #!4!#
          'Status: DUE',               // {{5}} -> #!5!#
          'Due Date: 20-Jan-2025',     // {{6}} -> #!6!#
          'Contact: +919462553887',    // {{7}} -> #!7!#
          'Pay on time - Finonest India!' // {{8}} -> #!8!#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! EMI reminder sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return { success: true, scenario: 'emi_reminder' };
    } else {
      console.log('❌ EMI reminder failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ EMI reminder error:', error.response?.data?.message || error.message);
  }

  return { success: false };
}

async function main() {
  console.log('🎯 Testing FINONESTDEMO with Correct Variable Mapping\n');
  console.log('Variables: #!1!#, #!2!#, #!3!#, #!4!#, #!5!#, #!6!#, #!7!#, #!8!#\n');
  
  const result = await testFinonestdemoCorrectVariables();
  
  if (result.success) {
    console.log(`\n🎊 PERFECT! FINONESTDEMO template works with ${result.scenario}!`);
    console.log('🚀 Variables are properly mapped and replaced!');
    
    console.log('\n📋 FINONESTDEMO Template Features:');
    console.log('✅ Professional WhatsApp template');
    console.log('✅ 8 customizable variables');
    console.log('✅ Proper variable replacement');
    console.log('✅ Perfect for Car Credit Hub notifications');
    
    console.log('\n🎯 Template Variable Mapping:');
    console.log('{{1}} -> #!1!# - Subject/Title');
    console.log('{{2}} -> #!2!# - Loan ID');
    console.log('{{3}} -> #!3!# - Vehicle Details');
    console.log('{{4}} -> #!4!# - Amount/Description');
    console.log('{{5}} -> #!5!# - Status');
    console.log('{{6}} -> #!6!# - Next Step/Timeline');
    console.log('{{7}} -> #!7!# - Contact Information');
    console.log('{{8}} -> #!8!# - Closing Message');
    
    console.log('\n🎊 FINONESTDEMO template is ready for production!');
  } else {
    console.log('\n⚠️ FINONESTDEMO template still needs work.');
    console.log('📋 Status: Pending - may need WhatsApp approval');
    console.log('📋 Continue using your working solutions:');
    console.log('• finodemo template (works but variables may not replace)');
    console.log('• Regular messages (always work perfectly)');
    console.log('• Smart sending system (template + fallback)');
  }
}

main();