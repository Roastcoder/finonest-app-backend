import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function testCorrectVariableMapping() {
  console.log('🔧 Testing FINODEMO with correct variable mapping...\n');
  
  console.log('📋 Template Structure:');
  console.log('Hello {{1}}     <- #username#');
  console.log('{{2}}           <- #1#');
  console.log('{{3}}           <- #2#');
  console.log('{{4}}           <- #3#');
  console.log('{{5}}           <- #4#');
  console.log('{{6}}           <- #5#');
  console.log('{{7}}           <- #6#');
  console.log('{{8}}           <- #7#');
  console.log('You can check the details below for your convenience.');
  console.log('{{9}}           <- #8#');
  console.log('🙂 Thanks for taking a moment to read this message\n');

  try {
    console.log('📤 Sending with correct parameter order...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_id: '336920', // FINODEMO template
        phone_number: TARGET_PHONE,
        parameters: [
          'Yogi Faujdar',              // {{1}} -> replaces #username#
          '🎉 Loan Approved!',         // {{2}} -> replaces #1#
          'Loan ID: LOAN123',          // {{3}} -> replaces #2#
          'Vehicle: Maruti Swift VXI', // {{4}} -> replaces #3#
          'Amount: ₹5,00,000',        // {{5}} -> replaces #4#
          'Status: APPROVED',          // {{6}} -> replaces #5#
          'Next: Submit documents',    // {{7}} -> replaces #6#
          'Contact: +919462553887',    // {{8}} -> replaces #7#
          'Congratulations - Finonest!' // {{9}} -> replaces #8#
        ]
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Variables should now be replaced!');
      console.log('📧 Message ID:', response.data.wa_message_id);
      console.log('\n📱 Expected message format:');
      console.log('Hello Yogi Faujdar');
      console.log('🎉 Loan Approved!');
      console.log('Loan ID: LOAN123');
      console.log('Vehicle: Maruti Swift VXI');
      console.log('Amount: ₹5,00,000');
      console.log('Status: APPROVED');
      console.log('Next: Submit documents');
      console.log('Contact: +919462553887');
      console.log('You can check the details below for your convenience.');
      console.log('Congratulations - Finonest!');
      console.log('🙂 Thanks for taking a moment to read this message');
      return true;
    } else {
      console.log('❌ Failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }

  return false;
}

async function testDifferentParameterFormats() {
  console.log('\n🧪 Testing different parameter formats...\n');

  const formats = [
    {
      name: 'Array Format',
      params: [
        'Yogi Faujdar',
        '🎉 Loan Approved!',
        'Loan ID: LOAN123',
        'Vehicle: Maruti Swift VXI',
        'Amount: ₹5,00,000',
        'Status: APPROVED',
        'Next: Submit documents',
        'Contact: +919462553887',
        'Congratulations - Finonest!'
      ]
    },
    {
      name: 'Object Format',
      params: {
        '1': 'Yogi Faujdar',
        '2': '🎉 Loan Approved!',
        '3': 'Loan ID: LOAN123',
        '4': 'Vehicle: Maruti Swift VXI',
        '5': 'Amount: ₹5,00,000',
        '6': 'Status: APPROVED',
        '7': 'Next: Submit documents',
        '8': 'Contact: +919462553887',
        '9': 'Congratulations - Finonest!'
      }
    }
  ];

  for (const format of formats) {
    try {
      console.log(`📤 Testing ${format.name}...`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_id: '336920',
          phone_number: TARGET_PHONE,
          parameters: format.params
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${format.name}: SUCCESS!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        return true;
      } else {
        console.log(`❌ ${format.name}: ${response.data.message}`);
      }

    } catch (error) {
      console.log(`❌ ${format.name}: ${error.response?.data?.message || error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  return false;
}

async function main() {
  console.log('🎯 Fixing FINODEMO Template Variable Replacement\n');
  
  const success = await testCorrectVariableMapping();
  
  if (!success) {
    console.log('🔄 Trying different parameter formats...');
    await testDifferentParameterFormats();
  }
  
  console.log('\n📋 If variables still show as #username#, #1#, etc.:');
  console.log('1. Go to BotBiz Dashboard → Templates → finodemo');
  console.log('2. Check Variable Mapping section');
  console.log('3. Ensure {{1}} maps to #username#, {{2}} maps to #1#, etc.');
  console.log('4. Save the mapping and test again');
  console.log('\n💡 Alternative: Use regular messages (they work perfectly!)');
}

main();