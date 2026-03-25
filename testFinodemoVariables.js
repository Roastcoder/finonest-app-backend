import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testFinodemoWithExistingVariables() {
  console.log('🧪 Testing FINODEMO template with existing BotBiz variables...\n');
  
  console.log('📋 Available Variables in BotBiz:');
  console.log('Text Variables: #Cibil Score#, #EMI Bounce#, #Existing Loan#, #Maker#, #Model#, #RCNo#, #RTO#');
  console.log('Number Variables: #LoanAmt#, #RegDate#, #SRNo#\n');

  // Test 1: Using existing variables for loan notification
  try {
    console.log('📤 Test 1: Loan notification using existing variables...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',           // {{1}} - Customer Name
          '🎉 Loan Approved!',      // {{2}} - Subject
          'LOAN123',                // {{3}} - Can use #SRNo#
          'Maruti Swift VXI',       // {{4}} - Can use #Model#
          '₹5,00,000',             // {{5}} - Can use #LoanAmt#
          'APPROVED',               // {{6}} - Status
          'Submit documents',       // {{7}} - Next step
          'Call: +919462553887',    // {{8}} - Contact
          'Congratulations!'        // {{9}} - Closing
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! FINODEMO template works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎊 Perfect for Car Credit Hub notifications!');
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Test 2: RC Verification style using existing variables
  try {
    console.log('\n📤 Test 2: RC verification style...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',           // {{1}} - Customer Name
          '🚗 RC Verification',     // {{2}} - Subject
          'LOAN123',                // {{3}} - Service Request (#SRNo#)
          'MH12AB1234',            // {{4}} - Registration (#RCNo#)
          'Maruti Swift VXI',       // {{5}} - Model (#Model#)
          'Maruti Suzuki',          // {{6}} - Maker (#Maker#)
          'Mumbai RTO',             // {{7}} - RTO (#RTO#)
          'Call: +919462553887',    // {{8}} - Contact
          'Please confirm details'  // {{9}} - Closing
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! RC verification works!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  // Test 3: Simple test without parameters
  try {
    console.log('\n📤 Test 3: Simple test without parameters...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE
        // No parameters - test if template exists
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Template exists and is mapped!');
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

async function testVariableMappingScenarios() {
  console.log('\n🏦 Testing different variable mapping scenarios...\n');

  const scenarios = [
    {
      name: 'Loan Approval with Variables',
      params: [
        'Yogi Faujdar',           // Customer name
        '🎉 Loan Approved',       // Subject
        'LOAN123',                // #SRNo#
        'Swift VXI',              // #Model#
        '500000',                 // #LoanAmt#
        'APPROVED',               // Status
        'Submit documents',       // Next step
        '+919462553887',          // Contact
        'Congratulations!'        // Closing
      ]
    },
    {
      name: 'EMI Bounce Alert',
      params: [
        'Yogi Faujdar',           // Customer name
        '⚠️ EMI Bounce Alert',    // Subject
        'LOAN123',                // #SRNo#
        'Swift VXI',              // #Model#
        '12500',                  // EMI amount
        'BOUNCED',                // #EMI Bounce#
        'Pay immediately',        // Next step
        '+919462553887',          // Contact
        'Avoid penalties'         // Closing
      ]
    },
    {
      name: 'Document Request',
      params: [
        'Yogi Faujdar',           // Customer name
        '📄 Documents Needed',    // Subject
        'LOAN123',                // #SRNo#
        'Swift VXI',              // #Model#
        'PAN, Aadhar',           // Documents
        'PENDING',                // Status
        'Upload within 3 days',   // Next step
        '+919462553887',          // Contact
        'Submit soon'             // Closing
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
          template_name: 'finodemo',
          phone_number: TARGET_PHONE,
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
  console.log('🎯 FINODEMO Template Test with Existing Variables\n');
  
  const basicSuccess = await testFinodemoWithExistingVariables();
  
  if (basicSuccess) {
    console.log('\n🎊 FINODEMO template is working!');
    console.log('🚀 Testing different loan scenarios...');
    await testVariableMappingScenarios();
  } else {
    console.log('\n⚠️ FINODEMO template still needs mapping.');
    console.log('📋 Next steps:');
    console.log('1. Check if template is enabled for API');
    console.log('2. Map variables in BotBiz dashboard');
    console.log('3. Contact BotBiz support if needed');
  }
  
  console.log('\n📊 Available Variables for Mapping:');
  console.log('• #Cibil Score# - Customer credit score');
  console.log('• #EMI Bounce# - EMI bounce status');
  console.log('• #Existing Loan# - Existing loan details');
  console.log('• #Maker# - Vehicle manufacturer');
  console.log('• #Model# - Vehicle model');
  console.log('• #RCNo# - Registration certificate number');
  console.log('• #RTO# - Regional transport office');
  console.log('• #LoanAmt# - Loan amount');
  console.log('• #RegDate# - Registration date');
  console.log('• #SRNo# - Service request number');
}

main();