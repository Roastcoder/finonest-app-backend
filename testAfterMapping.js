import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

// Test after BotBiz maps the templates
async function testAfterMapping() {
  console.log('🧪 Testing templates AFTER BotBiz mapping...\n');

  const templates = [
    {
      name: 'finodemo',
      params: [
        'Yogi Faujdar',              // {{1}} - Name
        '🎉 Loan Approved!',         // {{2}} - Subject
        'LOAN123',                   // {{3}} - Loan ID
        'Maruti Swift VXI',          // {{4}} - Vehicle
        '₹5,00,000',                // {{5}} - Amount
        'APPROVED',                  // {{6}} - Status
        'Documentation needed',       // {{7}} - Next step
        'Call: +919462553887',       // {{8}} - Contact
        'Congratulations - Finonest' // {{9}} - Closing
      ]
    },
    {
      name: 'demo',
      params: [
        'Yogi Faujdar',
        '🎉 Loan Approved!',
        'LOAN123',
        'Maruti Swift VXI',
        '₹5,00,000',
        'APPROVED',
        'Documentation needed',
        'Call: +919462553887',
        'Congratulations - Finonest'
      ]
    },
    {
      name: 'data_rc',
      params: [
        'Yogi Faujdar',        // {{1}} - Name
        'LOAN123',             // {{2}} - Service Request ID
        'MH12AB1234',          // {{3}} - Reg No
        'Maruti Swift VXI',    // {{4}} - Car Model
        'Maruti Suzuki',       // {{5}} - Maker
        '15-Jan-2020',         // {{6}} - Reg Date
        'Mumbai RTO'           // {{7}} - RTO
      ]
    }
  ];

  for (const template of templates) {
    try {
      console.log(`🧪 Testing: ${template.name}`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_name: template.name,
          phone_number: TARGET_PHONE,
          parameters: template.params
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${template.name}: SUCCESS!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        console.log('🎊 Template mapping worked!');
        return true;
      } else {
        console.log(`❌ ${template.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${template.name}: ${error.response?.data?.message || error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return false;
}

async function main() {
  const success = await testAfterMapping();
  
  if (success) {
    console.log('\n🎊 SUCCESS! Templates are now mapped and working!');
    console.log('🚀 You can now use templates for Car Credit Hub notifications!');
  } else {
    console.log('\n⚠️ Templates still not mapped. Contact BotBiz support.');
    console.log('💡 Meanwhile, use regular messages - they work perfectly!');
  }
}

main();