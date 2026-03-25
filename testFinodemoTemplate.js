import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testFinodemoTemplate() {
  console.log('🧪 Testing FINODEMO template (ID: 336920) - APPROVED STATUS...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finodemo',
        phone_number: TARGET_PHONE,
        parameters: [
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
      }
    );

    if (response.data.status === '1') {
      console.log('✅ FINODEMO template SUCCESS!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('🎯 Perfect! This template works for loan notifications!');
      return true;
    } else {
      console.log('❌ FINODEMO template failed:', response.data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDifferentScenarios() {
  console.log('\n🏦 Testing FINODEMO with different loan scenarios...\n');

  const scenarios = [
    {
      name: 'Loan Approval',
      params: [
        'Yogi Faujdar',
        '🎉 Loan Approved!',
        'LOAN123',
        'Maruti Swift VXI',
        '₹5,00,000',
        'APPROVED',
        'Submit documents within 7 days',
        'Contact: +919462553887',
        'Congratulations from Finonest India!'
      ]
    },
    {
      name: 'Document Request',
      params: [
        'Yogi Faujdar',
        '📄 Documents Required',
        'LOAN123',
        'Maruti Swift VXI',
        'PAN, Aadhar, Salary Slip',
        'PENDING',
        'Upload within 3 days',
        'Contact: +919462553887',
        'Please submit soon - Finonest'
      ]
    },
    {
      name: 'EMI Reminder',
      params: [
        'Yogi Faujdar',
        '💰 EMI Due',
        'LOAN123',
        'Maruti Swift VXI',
        '₹12,500',
        'DUE',
        'Pay by 20-Jan-2025',
        'Contact: +919462553887',
        'Pay on time - Finonest India'
      ]
    },
    {
      name: 'RC Verification',
      params: [
        'Yogi Faujdar',
        '🚗 RC Verification',
        'LOAN123',
        'MH12AB1234',
        'Maruti Swift VXI',
        'PENDING',
        'Verify RC details',
        'Contact: +919462553887',
        'Please confirm - Finonest'
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
        break; // Stop after first successful send
      } else {
        console.log(`❌ ${scenario.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${scenario.name}: ${error.response?.data?.message || error.message}`);
    }

    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  const basicTest = await testFinodemoTemplate();
  
  if (basicTest) {
    console.log('\n🎊 FINODEMO template works! Testing scenarios...');
    await testDifferentScenarios();
  } else {
    console.log('\n⚠️ FINODEMO template has mapping issues');
  }
  
  console.log('\n📋 FINODEMO Template Structure (9 variables):');
  console.log('{{1}} - Customer Name');
  console.log('{{2}} - Subject/Title');
  console.log('{{3}} - Loan ID / Reference');
  console.log('{{4}} - Vehicle Details / Item');
  console.log('{{5}} - Amount / Description');
  console.log('{{6}} - Status');
  console.log('{{7}} - Next Step / Action');
  console.log('{{8}} - Contact Information');
  console.log('{{9}} - Closing Message');
  
  console.log('\n🎯 If FINODEMO works, you have the perfect template for Car Credit Hub!');
}

main();