import axios from 'axios';

const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '917340522554';

async function testWelcomeTemplate() {
  console.log('🧪 Testing finonestwelcome template (ID: 336964)');
  console.log('📱 Phone: 7340522554\n');
  
  // First, get all available templates
  try {
    console.log('🔍 Getting available templates...');
    const templatesResponse = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/template/list',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID
      }
    );

    console.log('📋 Available templates:', JSON.stringify(templatesResponse.data, null, 2));
    
    // Check if finonestwelcome exists
    const templates = templatesResponse.data.templates || [];
    const welcomeTemplate = templates.find(t => t.name === 'finonestwelcome');
    
    if (welcomeTemplate) {
      console.log('✅ Found finonestwelcome template!');
      console.log('📄 Template details:', welcomeTemplate);
    } else {
      console.log('❌ finonestwelcome template not found');
      console.log('🔍 Available template names:', templates.map(t => t.name));
    }
    
  } catch (error) {
    console.error('❌ Failed to get templates:', error.response?.data || error.message);
  }

  // Try to send finonestwelcome template
  try {
    console.log('\n📤 Attempting to send finonestwelcome template...');
    
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: 'finonestwelcome',
        phone_number: TARGET_PHONE,
        parameters: []
      }
    );

    if (response.data.status === '1') {
      console.log('✅ SUCCESS! Welcome template sent!');
      console.log('📧 Message ID:', response.data.wa_message_id);
    } else {
      console.log('❌ Failed to send:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ ERROR sending welcome template:');
    console.error('Response:', error.response?.data);
  }

  // Fallback: Try sending a working template as welcome message
  console.log('\n🔄 Fallback: Sending working template as welcome...');
  
  const workingTemplates = [
    {
      name: 'demo',
      parameters: [
        'Welcome User',                  // {{1}} - Name
        '🎉 Welcome to Finonest!',      // {{2}} - Subject
        'WELCOME001',                   // {{3}} - ID
        'Car Loan Services',            // {{4}} - Service
        'Best Rates Available',         // {{5}} - Offer
        'ACTIVE',                       // {{6}} - Status
        'Explore our services',         // {{7}} - Next step
        'Call: +919462553887',          // {{8}} - Contact
        'Welcome to Finonest India!'    // {{9}} - Closing
      ]
    },
    {
      name: 'testing',
      parameters: [
        'Welcome User',                  // {{1}} - Name
        '🎉 Welcome to Finonest!',      // {{2}} - Subject
        'WELCOME001',                   // {{3}} - ID
        'Car Loan Services'             // {{4}} - Service
      ]
    }
  ];

  for (const template of workingTemplates) {
    try {
      console.log(`\n🧪 Trying ${template.name} as welcome message...`);
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_name: template.name,
          phone_number: TARGET_PHONE,
          parameters: template.parameters
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ SUCCESS! Welcome sent via ${template.name}!`);
        console.log('📧 Message ID:', response.data.wa_message_id);
        break;
      } else {
        console.log(`❌ ${template.name} failed:`, response.data.message);
      }
      
    } catch (error) {
      console.log(`❌ ${template.name} error:`, error.response?.data?.message || error.message);
    }
  }
}

testWelcomeTemplate();