import axios from 'axios';

// Send template message to specific number
const API_TOKEN = '15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07';
const PHONE_NUMBER_ID = '716044761593234';
const TARGET_PHONE = '916378110608';

async function sendTemplateMessage() {
  console.log('📱 Sending template message to 6378110608...\n');

  // First, let's get available templates
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

  } catch (error) {
    console.error('❌ Failed to get templates:', error.response?.data || error.message);
  }

  // Test approved templates that work
  const approvedTemplates = [
    { name: 'data_rc', params: 7 },
    { name: 'demo', params: 9 },
    { name: 'testing', params: 4 },
    { name: 'cc_offer', params: 2 },
    { name: 'newucl', params: 4 }
  ];

  for (const template of approvedTemplates) {
    try {
      console.log(`\n🧪 Testing ${template.name} template...`);
      
      let parameters = [];
      
      if (template.name === 'data_rc') {
        parameters = [
          'Yogi Faujdar',        // {{1}} - Name
          'LOAN123',             // {{2}} - Service Request ID
          'MH12AB1234',          // {{3}} - Reg No
          'Maruti Swift VXI',    // {{4}} - Car Model
          'Maruti Suzuki',       // {{5}} - Maker
          '15-Jan-2020',         // {{6}} - Reg Date
          'Mumbai RTO'           // {{7}} - RTO
        ];
      } else if (template.name === 'demo') {
        parameters = [
          'Yogi Faujdar',              // {{1}} - Name
          '🎉 Loan Approved!',         // {{2}} - Subject
          'LOAN123',                   // {{3}} - Loan ID
          'Maruti Swift VXI',          // {{4}} - Vehicle
          '₹5,00,000',                // {{5}} - Amount
          'APPROVED',                  // {{6}} - Status
          'Documentation needed',       // {{7}} - Next step
          'Call: +919462553887',       // {{8}} - Contact
          'Congratulations - Finonest' // {{9}} - Closing
        ];
      } else if (template.name === 'testing') {
        parameters = [
          'Yogi Faujdar',              // {{1}} - Name
          '🎉 Loan Approved!',         // {{2}} - Subject
          'LOAN123',                   // {{3}} - Loan ID
          'Maruti Swift VXI'           // {{4}} - Vehicle
        ];
      } else if (template.name === 'cc_offer') {
        parameters = [
          'Yogi Faujdar',              // {{1}} - Name
          'HDFC Bank'                  // {{2}} - Bank
        ];
      } else if (template.name === 'newucl') {
        parameters = [
          'Yogi Faujdar',              // {{1}} - Name
          'MH12AB1234',                // {{2}} - Reg No
          'Maruti Swift VXI',          // {{3}} - Model
          '₹5,00,000'                  // {{4}} - Amount
        ];
      }
      
      const response = await axios.post(
        'https://dash.botbiz.io/api/v1/whatsapp/send/template',
        {
          apiToken: API_TOKEN,
          phone_number_id: PHONE_NUMBER_ID,
          template_name: template.name,
          phone_number: TARGET_PHONE,
          parameters
        }
      );

      if (response.data.status === '1') {
        console.log(`✅ ${template.name}: SUCCESS!`);
        console.log(`📧 Message ID: ${response.data.wa_message_id}`);
        break; // Stop after first successful send
      } else {
        console.log(`❌ ${template.name}: ${response.data.message}`);
      }
      
    } catch (error) {
      console.log(`❌ ${template.name}: ${error.response?.data?.message || error.message}`);
    }
  }
    
    // Alternative: Try with different template names
    const templateNames = ['testing', 'demo', 'newucl'];
    
    for (const templateName of templateNames) {
      try {
        console.log(`🔄 Trying template: ${templateName}`);
        
        const response = await axios.post(
          'https://dash.botbiz.io/api/v1/whatsapp/send/template',
          {
            apiToken: API_TOKEN,
            phone_number_id: PHONE_NUMBER_ID,
            template_name: templateName,
            phone_number: TARGET_PHONE
          }
        );

        console.log(`✅ Success with template '${templateName}'!`);
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
        break;
        
      } catch (templateError) {
        console.log(`❌ Template '${templateName}' failed:`, templateError.response?.data?.message || templateError.message);
      }
    }
}

// Alternative: Try to initiate conversation first
async function initiateConversation() {
  console.log('🤝 Trying to initiate conversation...\n');
  
  try {
    // Check if user exists in subscribers
    const subscriberResponse = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/subscriber/get',
      {
        apiToken: API_TOKEN,
        phone_number_id: PHONE_NUMBER_ID,
        phone_number: TARGET_PHONE
      }
    );

    console.log('👤 Subscriber info:', JSON.stringify(subscriberResponse.data, null, 2));
    
  } catch (error) {
    console.log('ℹ️ Subscriber not found or error:', error.response?.data?.message || error.message);
  }
}

// Run both functions
async function runTest() {
  await initiateConversation();
  await sendTemplateMessage();
  
  console.log('\n💡 Note: To send regular messages, the recipient needs to message your WhatsApp Business number first within 24 hours.');
  console.log('📞 Your WhatsApp Business: +919462553887');
  console.log('🎯 Ask the recipient (6378110608) to send "Hi" to +919462553887 first, then you can send regular messages.');
}

// Loan notification functions for your Car Credit Hub
export const sendLoanApproval = async (phone, loanData) => {
  return await axios.post(
    'https://dash.botbiz.io/api/v1/whatsapp/send/template',
    {
      apiToken: API_TOKEN,
      phone_number_id: PHONE_NUMBER_ID,
      template_name: 'demo',
      phone_number: phone,
      parameters: [
        loanData.customerName,           // {{1}} - Name
        '🎉 Loan Approved!',            // {{2}} - Subject
        loanData.loanId,                // {{3}} - Loan ID
        loanData.vehicleDetails,        // {{4}} - Vehicle
        `₹${loanData.amount}`,          // {{5}} - Amount
        'APPROVED',                     // {{6}} - Status
        'Documentation needed',         // {{7}} - Next step
        'Call: +919462553887',          // {{8}} - Contact
        'Congratulations - Finonest'    // {{9}} - Closing
      ]
    }
  );
};

export const sendLoanRejection = async (phone, loanData) => {
  return await axios.post(
    'https://dash.botbiz.io/api/v1/whatsapp/send/template',
    {
      apiToken: API_TOKEN,
      phone_number_id: PHONE_NUMBER_ID,
      template_name: 'demo',
      phone_number: phone,
      parameters: [
        loanData.customerName,           // {{1}} - Name
        '❌ Loan Update',               // {{2}} - Subject
        loanData.loanId,                // {{3}} - Loan ID
        loanData.vehicleDetails,        // {{4}} - Vehicle
        `₹${loanData.amount}`,          // {{5}} - Amount
        'REJECTED',                     // {{6}} - Status
        loanData.reason,                // {{7}} - Reason
        'Call: +919462553887',          // {{8}} - Contact
        'Thank you - Finonest'          // {{9}} - Closing
      ]
    }
  );
};

export const sendDocumentRequest = async (phone, loanData) => {
  return await axios.post(
    'https://dash.botbiz.io/api/v1/whatsapp/send/template',
    {
      apiToken: API_TOKEN,
      phone_number_id: PHONE_NUMBER_ID,
      template_name: 'demo',
      phone_number: phone,
      parameters: [
        loanData.customerName,           // {{1}} - Name
        '📄 Documents Required',        // {{2}} - Subject
        loanData.loanId,                // {{3}} - Loan ID
        loanData.vehicleDetails,        // {{4}} - Vehicle
        loanData.documentsNeeded,       // {{5}} - Documents
        'PENDING',                      // {{6}} - Status
        `Submit within ${loanData.days} days`, // {{7}} - Timeline
        'Call: +919462553887',          // {{8}} - Contact
        'Upload soon - Finonest'        // {{9}} - Closing
      ]
    }
  );
};

export const sendEMIReminder = async (phone, loanData) => {
  return await axios.post(
    'https://dash.botbiz.io/api/v1/whatsapp/send/template',
    {
      apiToken: API_TOKEN,
      phone_number_id: PHONE_NUMBER_ID,
      template_name: 'demo',
      phone_number: phone,
      parameters: [
        loanData.customerName,           // {{1}} - Name
        '💰 EMI Reminder',              // {{2}} - Subject
        loanData.loanId,                // {{3}} - Loan ID
        loanData.vehicleDetails,        // {{4}} - Vehicle
        `₹${loanData.emiAmount}`,       // {{5}} - EMI Amount
        'DUE',                          // {{6}} - Status
        `Due: ${loanData.dueDate}`,     // {{7}} - Due date
        'Call: +919462553887',          // {{8}} - Contact
        'Pay on time - Finonest'        // {{9}} - Closing
      ]
    }
  );
};

// RC Verification using data_rc template
export const sendRCVerification = async (phone, customerData) => {
  return await axios.post(
    'https://dash.botbiz.io/api/v1/whatsapp/send/template',
    {
      apiToken: API_TOKEN,
      phone_number_id: PHONE_NUMBER_ID,
      template_name: 'data_rc',
      phone_number: phone,
      parameters: [
        customerData.name,        // #User-Name#
        customerData.srNo,        // #SRNo#
        customerData.rcNo,        // #RCNo#
        customerData.model,       // #Model#
        customerData.maker,       // #Maker#
        customerData.regDate,     // #RegDate#
        customerData.rto          // #RTO#
      ]
    }
  );
};

runTest();