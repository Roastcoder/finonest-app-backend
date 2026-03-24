import axios from 'axios';

// Simple, compliant templates for Finonest India
const COMPLIANT_TEMPLATES = {
  // UTILITY Templates (High approval rate)
  loan_update: {
    name: 'loan_update',
    category: 'UTILITY',
    language: 'en_US',
    body: `Hello {{1}},

Your loan application {{2}} status: {{3}}

Amount: Rs {{4}}
Date: {{5}}

For queries, contact us.

Finonest India`,
    variables: ['John Doe', 'LOAN123', 'Under Review', '500000', '15-Jan-2024']
  },

  document_received: {
    name: 'document_received',
    category: 'UTILITY', 
    language: 'en_US',
    body: `Dear {{1}},

Document received for application {{2}}.

Document: {{3}}
Status: {{4}}

Thank you.

Finonest India`,
    variables: ['John Doe', 'LOAN123', 'PAN Card', 'Verified']
  },

  payment_due: {
    name: 'payment_due',
    category: 'UTILITY',
    language: 'en_US', 
    body: `Dear {{1}},

Payment reminder for loan {{2}}.

Amount: Rs {{3}}
Due: {{4}}

Please pay on time.

Finonest India`,
    variables: ['John Doe', 'LOAN123', '15000', '20-Jan-2024']
  },

  // MARKETING Template (Simple welcome)
  welcome_msg: {
    name: 'welcome_msg',
    category: 'MARKETING',
    language: 'en_US',
    body: `Welcome {{1}}!

Thank you for choosing Finonest India for your vehicle loan needs.

We will assist you throughout the process.

Best regards,
Finonest India Team`,
    variables: ['John Doe']
  }
};

// Function to create template submission format
function generateTemplateSubmission(templateKey) {
  const template = COMPLIANT_TEMPLATES[templateKey];
  
  console.log(`📋 Template: ${template.name}`);
  console.log(`Category: ${template.category}`);
  console.log(`Language: ${template.language}\n`);
  
  console.log('Body Text:');
  console.log('```');
  console.log(template.body);
  console.log('```\n');
  
  console.log('Variable Examples:');
  template.variables.forEach((variable, index) => {
    console.log(`{{${index + 1}}} = ${variable}`);
  });
  console.log('\n' + '='.repeat(50) + '\n');
}

// Function to test with existing approved template
async function testWithExistingTemplate() {
  const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
  const PHONE_NUMBER_ID = '716044761593234';
  const TEST_PHONE = '916378110608';

  console.log('🧪 Testing with existing approved template...\n');

  try {
    // Use the promo_offer template but with loan-related message
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        message: `🏦 *Finonest India - Loan Update*

Hello Yogi Faujdar,

Your loan application LOAN123 has been received and is under review.

Application Details:
• Vehicle: Maruti Swift
• Amount: ₹5,00,000
• Status: Document Verification

Our team will contact you within 24 hours for next steps.

For queries: +919462553887

Thank you,
Finonest India Team`,
        phone_number: TEST_PHONE
      }
    );

    if (response.data.status === '1') {
      console.log('✅ Message sent successfully!');
      console.log('📧 Message ID:', response.data.wa_message_id);
    } else {
      console.log('❌ Failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    
    if (error.response?.data?.message?.includes('24 hour')) {
      console.log('\n💡 Solution: Ask Yogi to message +919462553887 first');
      console.log('Then you can send regular messages for 24 hours');
    }
  }
}

// Function to show rejection fixes
function showRejectionFixes() {
  console.log('🚫 Common Template Rejection Fixes\n');
  
  console.log('❌ REJECTED: Too promotional in UTILITY');
  console.log('✅ FIXED: Remove sales language, keep informational\n');
  
  console.log('❌ REJECTED: Variables unclear');
  console.log('✅ FIXED: Use clear examples like "John Doe", "LOAN123"\n');
  
  console.log('❌ REJECTED: Category mismatch');
  console.log('✅ FIXED: UTILITY for transactions, MARKETING for promotions\n');
  
  console.log('❌ REJECTED: Missing business context');
  console.log('✅ FIXED: Always include "Finonest India" and clear purpose\n');
}

// Function to show immediate workaround
function showWorkaround() {
  console.log('🔄 Immediate Workaround (While waiting for template approval)\n');
  
  console.log('1. Use existing approved templates:');
  console.log('   - promo_offer');
  console.log('   - new_year_greetings');
  console.log('   - data_rc\n');
  
  console.log('2. Send regular messages (if 24-hour window is open):');
  console.log('   - Ask customer to message +919462553887 first');
  console.log('   - Then send loan notifications as regular messages\n');
  
  console.log('3. Use your existing templates creatively:');
  console.log('   - Modify content through API parameters');
  console.log('   - Use generic templates for specific purposes\n');
}

// Main function
function main() {
  const action = process.argv[2];

  switch (action) {
    case 'compliant':
      console.log('📱 Compliant Templates for Finonest India\n');
      Object.keys(COMPLIANT_TEMPLATES).forEach(generateTemplateSubmission);
      break;
      
    case 'test':
      testWithExistingTemplate();
      break;
      
    case 'fixes':
      showRejectionFixes();
      break;
      
    case 'workaround':
      showWorkaround();
      break;
      
    default:
      console.log('🚫 Template Rejection Helper\n');
      console.log('Commands:');
      console.log('  node rejectionFix.js compliant   - Show compliant templates');
      console.log('  node rejectionFix.js test        - Test with existing template');
      console.log('  node rejectionFix.js fixes       - Show common rejection fixes');
      console.log('  node rejectionFix.js workaround  - Show immediate workarounds');
      console.log('');
      console.log('🎯 Quick start: node rejectionFix.js compliant');
  }
}

// Export for use in other files
export { COMPLIANT_TEMPLATES };

// Run if called directly
if (process.argv[1].endsWith('rejectionFix.js')) {
  main();
}