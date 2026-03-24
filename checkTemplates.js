import axios from 'axios';

// Check all existing templates in BotBiz account
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';

async function checkAllTemplates() {
  console.log('📋 Checking all templates in your BotBiz account...\n');

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/template/list',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID
      }
    );

    if (response.data.status === '1' && response.data.message) {
      const templates = Array.isArray(response.data.message) ? response.data.message : [response.data.message];
      
      console.log(`🎯 TOTAL TEMPLATES FOUND: ${templates.length}\n`);
      console.log('=' .repeat(80) + '\n');

      // Group templates by status
      const approved = templates.filter(t => t.status === 'Approved');
      const rejected = templates.filter(t => t.status === 'Rejected');
      const pending = templates.filter(t => t.status === 'Pending' || t.status === 'Not Mapped');

      console.log(`✅ APPROVED: ${approved.length} templates`);
      console.log(`❌ REJECTED: ${rejected.length} templates`);
      console.log(`⏳ PENDING/OTHER: ${pending.length} templates\n`);

      // Show approved templates (these you can use)
      if (approved.length > 0) {
        console.log('🟢 APPROVED TEMPLATES (Ready to use):\n');
        approved.forEach((template, index) => {
          console.log(`${index + 1}. Template: ${template.template_name}`);
          console.log(`   Category: ${template.template_category || 'N/A'}`);
          console.log(`   Language: ${template.locale}`);
          console.log(`   Updated: ${template.updated_at}`);
          
          // Count variables in body content
          const variableCount = (template.body_content.match(/\{\{\d+\}\}/g) || []).length;
          console.log(`   Variables: ${variableCount} (${template.body_content.match(/\{\{\d+\}\}/g) || 'none'})`);
          
          // Show first 100 characters of body
          const bodyPreview = template.body_content.substring(0, 100) + (template.body_content.length > 100 ? '...' : '');
          console.log(`   Preview: "${bodyPreview}"`);
          console.log('');
        });
      }

      // Show rejected templates (for reference)
      if (rejected.length > 0) {
        console.log('🔴 REJECTED TEMPLATES:\n');
        rejected.forEach((template, index) => {
          console.log(`${index + 1}. Template: ${template.template_name}`);
          console.log(`   Category: ${template.template_category || 'N/A'}`);
          console.log(`   Language: ${template.locale}`);
          console.log(`   Rejected: ${template.updated_at}`);
          console.log('');
        });
      }

      // Show pending templates
      if (pending.length > 0) {
        console.log('🟡 PENDING/OTHER TEMPLATES:\n');
        pending.forEach((template, index) => {
          console.log(`${index + 1}. Template: ${template.template_name}`);
          console.log(`   Status: ${template.status}`);
          console.log(`   Category: ${template.template_category || 'N/A'}`);
          console.log(`   Language: ${template.locale}`);
          console.log('');
        });
      }

      // Summary and recommendations
      console.log('=' .repeat(80));
      console.log('📊 SUMMARY:\n');
      console.log(`Total Templates: ${templates.length}`);
      console.log(`✅ Ready to use: ${approved.length}`);
      console.log(`❌ Rejected: ${rejected.length}`);
      console.log(`⏳ Pending: ${pending.length}\n`);

      if (approved.length > 0) {
        console.log('🎯 RECOMMENDATION:');
        console.log('Use your approved templates for loan notifications:');
        approved.forEach(template => {
          const variableCount = (template.body_content.match(/\{\{\d+\}\}/g) || []).length;
          console.log(`• ${template.template_name} (${variableCount} variables) - ${template.template_category || 'General'}`);
        });
        console.log('');
        console.log('🚀 Best for loan notifications: Templates with most variables');
      } else {
        console.log('⚠️  NO APPROVED TEMPLATES FOUND!');
        console.log('You need to create and get approval for at least one template.');
      }

    } else {
      console.log('❌ No templates found or error occurred');
      console.log('Response:', response.data);
    }

  } catch (error) {
    console.error('❌ Error checking templates:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication issue - check your API token');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Phone number ID might be incorrect');
    }
  }
}

// Function to show template usage examples
function showTemplateUsage(templateName, variableCount) {
  console.log(`\n📱 How to use ${templateName} template:\n`);
  
  const examples = {
    1: ['Customer Name'],
    2: ['Customer Name', 'Loan ID'],
    3: ['Customer Name', 'Loan ID', 'Amount'],
    4: ['Customer Name', 'Loan ID', 'Amount', 'Status'],
    5: ['Customer Name', 'Loan ID', 'Amount', 'Status', 'Next Step'],
    6: ['Customer Name', 'Loan ID', 'Amount', 'Status', 'Next Step', 'Contact'],
    7: ['Customer Name', 'Loan ID', 'Amount', 'Status', 'Next Step', 'Contact', 'Date'],
    8: ['Customer Name', 'Loan ID', 'Amount', 'Status', 'Next Step', 'Contact', 'Date', 'Vehicle'],
    9: ['Customer Name', 'Subject', 'Loan ID', 'Vehicle', 'Amount', 'Status', 'Next Step', 'Contact', 'Closing']
  };

  const exampleParams = examples[variableCount] || [`Param1`, `Param2`, `Param3`];
  
  console.log('JavaScript example:');
  console.log('```javascript');
  console.log(`await BotBizWhatsAppAPI.sendTemplateMessage(`);
  console.log(`  '916378110608',`);
  console.log(`  '${templateName}',`);
  console.log(`  [${exampleParams.map(p => `'${p}'`).join(', ')}]`);
  console.log(`);`);
  console.log('```');
}

// Function to test a specific template
async function testTemplate(templateName) {
  console.log(`🧪 Testing template: ${templateName}\n`);

  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/send/template',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        template_name: templateName,
        phone_number: '916378110608'
      }
    );

    if (response.data.status === '1') {
      console.log(`✅ Template ${templateName} sent successfully!`);
      console.log('📧 Message ID:', response.data.wa_message_id);
    } else {
      console.log(`❌ Template ${templateName} failed:`, response.data.message);
    }
  } catch (error) {
    console.error(`❌ Error testing ${templateName}:`, error.response?.data?.message || error.message);
  }
}

// Main function
async function main() {
  const action = process.argv[2];
  const templateName = process.argv[3];

  switch (action) {
    case 'list':
    case 'check':
    default:
      await checkAllTemplates();
      break;
      
    case 'test':
      if (templateName) {
        await testTemplate(templateName);
      } else {
        console.log('❌ Please provide template name: node checkTemplates.js test template_name');
      }
      break;
      
    case 'usage':
      if (templateName) {
        // This would need the variable count - simplified for now
        showTemplateUsage(templateName, 4);
      } else {
        console.log('❌ Please provide template name: node checkTemplates.js usage template_name');
      }
      break;
  }
}

// Run the script
main();