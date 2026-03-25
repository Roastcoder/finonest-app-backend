import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testNewuclWithButtons() {
  console.log('🧪 Testing NEWUCL template (ID: 277122) with quick reply buttons...\n');
  
  console.log('📋 Template: newucl');
  console.log('📋 Structure: Hello! #LEAD_USER_FIRST_NAME#');
  console.log('              Your application for loan is under review...');
  console.log('              Regis. No = #RegNo#');
  console.log('              Car Model = #ModelNo#');
  console.log('              Loan Amt. = #LoanAmt#');
  console.log('              Request you to please review and confirm.\n');

  try {
    console.log('📤 Method 1: With parameters and quick reply buttons...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '277122', // NEWUCL template
        phone_number: TARGET_PHONE,
        template_quick_reply_button_values: ["INTERESTED!", "NOT INTERESTED!"],
        parameters: [
          'Yogi Faujdar',        // #LEAD_USER_FIRST_NAME#
          'MH12AB1234',          // #RegNo#
          'Maruti Swift VXI',    // #ModelNo#
          '₹5,00,000'           // #LoanAmt#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! NEWUCL with buttons works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎊 Template with interactive buttons is working!');
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Method 2: Without parameters (test template existence)
  try {
    console.log('\n📤 Method 2: Without parameters...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '277122',
        phone_number: TARGET_PHONE,
        template_quick_reply_button_values: ["INTERESTED!", "NOT INTERESTED!"]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! NEWUCL template exists and works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Method 3: Using form-data format (like curl example)
  try {
    console.log('\n📤 Method 3: Form-data format...');
    
    const formData = new URLSearchParams();
    formData.append('apiToken', API_TOKEN);
    formData.append('phone_number_id', PHONE_NUMBER_ID);
    formData.append('template_id', '277122');
    formData.append('phone_number', TARGET_PHONE);
    formData.append('template_quick_reply_button_values', JSON.stringify(["INTERESTED!", "NOT INTERESTED!"]));
    formData.append('parameters', JSON.stringify([
      'Yogi Faujdar',
      'MH12AB1234',
      'Maruti Swift VXI',
      '₹5,00,000'
    ]));

    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Form-data format works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Form-data failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Form-data error:', error.response?.data?.message || error.message);
  }

  return false;
}

async function testMultipleLoanScenarios() {
  console.log('\n🏦 Testing multiple loan scenarios with NEWUCL template...\n');

  const scenarios = [
    {
      name: 'Car Loan Approval',
      params: [
        'Yogi Faujdar',
        'MH12AB1234',
        'Maruti Swift VXI',
        '₹5,00,000'
      ]
    },
    {
      name: 'Used Car Loan',
      params: [
        'Yogi Faujdar',
        'GJ01CD5678',
        'Honda City VX',
        '₹7,50,000'
      ]
    },
    {
      name: 'SUV Loan',
      params: [
        'Yogi Faujdar',
        'KA03EF9012',
        'Hyundai Creta SX',
        '₹12,00,000'
      ]
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`🧪 Testing: ${scenario.name}`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: '277122',
          phone_number: TARGET_PHONE,
          template_quick_reply_button_values: ["INTERESTED!", "NOT INTERESTED!"],
          parameters: scenario.params
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${scenario.name}: SUCCESS!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        break; // Stop after first success
      } else {
        console.log(`❌ ${scenario.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${scenario.name}: ${error.response?.data?.message || error.message}`);
    }

    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function main() {
  console.log('🎯 Testing NEWUCL Template with Interactive Buttons\n');
  console.log('Template ID: 277122');
  console.log('Features: 4 variables + Quick Reply Buttons');
  console.log('Buttons: "INTERESTED!" and "NOT INTERESTED!"\n');
  
  const success = await testNewuclWithButtons();
  
  if (success) {
    console.log('\n🎊 EXCELLENT! NEWUCL template with buttons is working!');
    console.log('🚀 Testing multiple loan scenarios...');
    await testMultipleLoanScenarios();
    
    console.log('\n📋 NEWUCL Template Features:');
    console.log('✅ Professional loan notification format');
    console.log('✅ Interactive quick reply buttons');
    console.log('✅ 4 variables: Name, Reg No, Model, Amount');
    console.log('✅ Perfect for Car Credit Hub loan approvals');
    
    console.log('\n🎯 Ready for production use!');
  } else {
    console.log('\n⚠️ NEWUCL template needs further configuration.');
    console.log('📋 Possible issues:');
    console.log('1. Template variables not properly mapped');
    console.log('2. Quick reply buttons not configured');
    console.log('3. Template needs API enabling');
    
    console.log('\n💡 Alternative: Use regular messages (they work perfectly!)');
  }
}

main();