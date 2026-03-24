import axios from 'axios';

// Template creation helper for BotBiz.io
const BOTBIZ_API = 'https://dash.botbiz.io/api/v1';
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

// Template definitions for Finonest India
const FINONEST_TEMPLATES = {
  loan_approved: {
    name: 'loan_approved',
    category: 'UTILITY',
    language: 'en_US',
    header: {
      type: 'TEXT',
      text: '🎊 Loan Approved!'
    },
    body: `Congratulations {{1}}!

Your loan has been APPROVED! 🎉

Loan Details:
• Application ID: {{2}}
• Approved Amount: ₹{{3}}
• Vehicle: {{4}}
• EMI: ₹{{5}}/month
• Tenure: {{6}} months

Our executive will contact you for the next steps.`,
    footer: 'Finonest India',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Thank You' },
      { type: 'PHONE_NUMBER', text: 'Call Now', phone_number: '+919462553887' }
    ],
    example: {
      body_text: [['Yogi Faujdar', 'LOAN123', '500000', 'Maruti Swift', '12500', '48']]
    }
  },

  document_required: {
    name: 'document_required',
    category: 'UTILITY',
    language: 'en_US',
    header: {
      type: 'TEXT',
      text: 'Document Required'
    },
    body: `Dear {{1}},

We need additional documents for your loan application {{2}}.

Required Document: {{3}}

Please upload the document through our portal or visit our branch.

Application Status: {{4}}`,
    footer: 'Finonest India',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Document Uploaded' },
      { type: 'PHONE_NUMBER', text: 'Need Help?', phone_number: '+919462553887' }
    ],
    example: {
      body_text: [['Yogi Faujdar', 'LOAN123', 'PAN Card', 'Under Review']]
    }
  },

  emi_reminder: {
    name: 'emi_reminder',
    category: 'UTILITY',
    language: 'en_US',
    header: {
      type: 'TEXT',
      text: '💳 EMI Payment Reminder'
    },
    body: `Dear {{1}},

This is a friendly reminder for your upcoming EMI payment.

Payment Details:
• Loan ID: {{2}}
• EMI Amount: ₹{{3}}
• Due Date: {{4}}
• Account: ***{{5}}

Please ensure timely payment to avoid late charges.`,
    footer: 'Finonest India',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Payment Done' },
      { type: 'PHONE_NUMBER', text: 'Support', phone_number: '+919462553887' }
    ],
    example: {
      body_text: [['Yogi Faujdar', 'LOAN123', '12500', '15-Jan-2024', '1234']]
    }
  },

  welcome_customer: {
    name: 'welcome_customer',
    category: 'MARKETING',
    language: 'en_US',
    header: {
      type: 'TEXT',
      text: 'Welcome to Finonest India! 🏦'
    },
    body: `Dear {{1}},

Thank you for choosing us for your vehicle loan needs. We're committed to making your loan journey smooth and hassle-free.

Our Services:
✅ Used Car Loans
✅ New Car Loans  
✅ Loan Against Vehicle
✅ Refinancing Options

Get pre-approved in minutes!`,
    footer: 'Finonest India - Your Trusted Loan Partner',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Apply Now' },
      { type: 'PHONE_NUMBER', text: 'Call Us', phone_number: '+919462553887' }
    ],
    example: {
      body_text: [['Yogi Faujdar']]
    }
  }
};

// Function to display template creation instructions
function displayTemplateInstructions() {
  console.log('📱 WhatsApp Template Creation Guide for Finonest India\n');
  
  console.log('🔗 BotBiz Dashboard: https://dash.botbiz.io');
  console.log('📞 Your Business Number: +919462553887');
  console.log('🆔 Phone Number ID: 716044761593234\n');

  console.log('📋 Templates to Create:\n');

  Object.keys(FINONEST_TEMPLATES).forEach((templateKey, index) => {
    const template = FINONEST_TEMPLATES[templateKey];
    console.log(`${index + 1}. Template Name: ${template.name}`);
    console.log(`   Category: ${template.category}`);
    console.log(`   Language: ${template.language}`);
    console.log(`   Header: ${template.header.text}`);
    console.log(`   Variables: ${template.example.body_text[0].length} parameters`);
    console.log('');
  });

  console.log('🛠️ Manual Creation Steps:');
  console.log('1. Login to https://dash.botbiz.io');
  console.log('2. Go to WhatsApp → Templates');
  console.log('3. Click "Create New Template"');
  console.log('4. Fill in template details from above');
  console.log('5. Submit for WhatsApp approval');
  console.log('6. Wait 24-48 hours for approval');
  console.log('7. Test with your phone number\n');
}

// Function to test existing templates
async function testExistingTemplates() {
  console.log('🧪 Testing Existing BotBiz Templates...\n');

  const existingTemplates = ['promo_offer', 'new_year_greetings', 'data_rc'];
  
  for (const templateName of existingTemplates) {
    try {
      console.log(`📤 Testing: ${templateName}`);
      
      const response = await axios.post(
        `${BOTBIZ_API}/whatsapp/send/template`,
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_name: templateName,
          phone_number: '916378110608'
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${templateName}: Sent successfully`);
      } else {
        console.log(`❌ ${templateName}: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${templateName}: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Function to check template approval status
async function checkTemplateStatus() {
  console.log('📋 Checking Template Status...\n');

  try {
    const response = await axios.post(
      `${BOTBIZ_API}/whatsapp/template/list`,
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID
      }
    );

    if (response.data.status === '1' && response.data.message) {
      const templates = Array.isArray(response.data.message) ? response.data.message : [response.data.message];
      
      console.log(`Found ${templates.length} templates:\n`);
      
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.template_name}`);
        console.log(`   Status: ${template.status}`);
        console.log(`   Category: ${template.template_category || 'N/A'}`);
        console.log(`   Language: ${template.locale}`);
        console.log('');
      });
    } else {
      console.log('No templates found or error occurred');
    }
  } catch (error) {
    console.error('Error checking templates:', error.response?.data || error.message);
  }
}

// Main function
async function main() {
  const action = process.argv[2];

  switch (action) {
    case 'instructions':
      displayTemplateInstructions();
      break;
    case 'test':
      await testExistingTemplates();
      break;
    case 'status':
      await checkTemplateStatus();
      break;
    default:
      console.log('📱 Finonest WhatsApp Template Helper\n');
      console.log('Usage:');
      console.log('  node templateHelper.js instructions  - Show template creation guide');
      console.log('  node templateHelper.js test         - Test existing templates');
      console.log('  node templateHelper.js status       - Check template approval status');
      console.log('');
      console.log('🚀 Quick Start: node templateHelper.js instructions');
  }
}

// Export templates for use in other files
export { FINONEST_TEMPLATES };

// Run if called directly
if (process.argv[1].endsWith('templateHelper.js')) {
  main();
}