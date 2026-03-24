import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testAfterHTTPAPIEnable() {
  console.log('🧪 Testing templates AFTER enabling HTTP API Integration...\n');

  const templates = [
    {
      name: 'newucl',
      description: 'NEWUCL - Loan notification (4 variables)',
      params: [
        'Yogi Faujdar',        // #LEAD_USER_FIRST_NAME#
        'MH12AB1234',          // #RegNo#
        'Maruti Swift VXI',    // #ModelNo#
        '₹5,00,000'           // #LoanAmt#
      ]
    },
    {
      name: 'finodemo',
      description: 'FINODEMO - Complete notification (9 variables)',
      params: [
        'Yogi Faujdar',              // #username#
        '🎉 Loan Approved!',         // #1#
        'Loan ID: LOAN123',          // #2#
        'Vehicle: Maruti Swift VXI', // #3#
        'Amount: ₹5,00,000',        // #4#
        'Status: APPROVED',          // #5#
        'Next: Submit documents',    // #6#
        'Contact: +919462553887',    // #7#
        'Congratulations - Finonest!' // #8#
      ]
    },
    {
      name: 'data_rc',
      description: 'DATA_RC - RC verification (7 variables)',
      params: [
        'Yogi Faujdar',        // Customer name
        'LOAN123',             // Service request ID
        'MH12AB1234',          // Registration number
        'Maruti Swift VXI',    // Car model
        'Maruti Suzuki',       // Maker
        '15-Jan-2020',         // Registration date
        'Mumbai RTO'           // RTO
      ]
    },
    {
      name: 'demo',
      description: 'DEMO - Full notification (9 variables)',
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
      name: 'testing',
      description: 'TESTING - Simple notification (4 variables)',
      params: [
        'Yogi Faujdar',
        '🎉 Loan Approved!',
        'LOAN123',
        'Maruti Swift VXI'
      ]
    }
  ];

  let successCount = 0;
  let workingTemplates = [];

  for (const template of templates) {
    try {
      console.log(`🧪 Testing: ${template.name} - ${template.description}`);
      
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
        successCount++;
        workingTemplates.push(template.name);
        break; // Stop after first success to avoid spam
      } else {
        console.log(`❌ ${template.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${template.name}: ${error.response?.data?.message || error.message}`);
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📊 RESULTS AFTER HTTP API INTEGRATION:');
  console.log(`✅ Working templates: ${successCount}`);
  console.log(`❌ Failed templates: ${templates.length - successCount}`);
  
  if (successCount > 0) {
    console.log('\n🎊 SUCCESS! Templates are now working!');
    console.log('🚀 Working templates:', workingTemplates.join(', '));
    console.log('💡 You can now use templates for Car Credit Hub notifications!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Integrate templates into your loan management system');
    console.log('2. Use templates for automated notifications');
    console.log('3. Combine with regular messages for best results');
  } else {
    console.log('\n⚠️ Templates still not working after HTTP API integration.');
    console.log('📋 Possible issues:');
    console.log('1. Templates not properly enabled in HTTP API settings');
    console.log('2. Need to wait for changes to take effect');
    console.log('3. Contact BotBiz support for manual enabling');
    
    console.log('\n💡 Meanwhile, regular messages work perfectly!');
    console.log('🚀 Continue using NewuclStyleService and FinodemoStyleService');
  }

  return successCount > 0;
}

async function main() {
  console.log('🎯 Template Test After HTTP API Integration\n');
  console.log('📋 Prerequisites:');
  console.log('1. Go to Settings & Integration → HTTP API Integration');
  console.log('2. Enable "WhatsApp HTTP API"');
  console.log('3. Enable template API access for your templates');
  console.log('4. Save settings and wait a few minutes\n');
  
  await testAfterHTTPAPIEnable();
}

main();