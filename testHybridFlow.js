import { HybridWhatsAppService, testHybridFlow } from './src/services/hybridWhatsAppService.js';

async function main() {
  console.log('🚀 TESTING HYBRID WHATSAPP STRATEGY\n');
  console.log('Strategy: Template Welcome → Direct Loan Message\n');
  console.log('Benefits:');
  console.log('✅ Template bypasses 24-hour rule');
  console.log('✅ Direct message has better formatting');
  console.log('✅ Professional loan notifications\n');
  
  // Test the complete flow
  await testHybridFlow();
  
  console.log('\n🎯 USAGE EXAMPLES:\n');
  
  // Example 1: Loan Approval
  console.log('1️⃣ LOAN APPROVAL:');
  console.log(`
const customerData = {
  name: 'Yogi Faujdar',
  loanId: 'LOAN123',
  vehicleDetails: 'Maruti Swift VXI',
  vehicleReg: 'MH12AB1234',
  amount: '5,00,000'
};

await HybridWhatsAppService.sendLoanApprovalFlow('916378110608', customerData);
`);

  // Example 2: Document Request
  console.log('2️⃣ DOCUMENT REQUEST:');
  console.log(`
const customerData = {
  name: 'Yogi Faujdar',
  loanId: 'LOAN123',
  vehicleDetails: 'Maruti Swift VXI',
  documentsNeeded: 'PAN, Aadhar, Salary Slip',
  days: '3'
};

await HybridWhatsAppService.sendDocumentRequestFlow('916378110608', customerData);
`);

  // Example 3: EMI Reminder
  console.log('3️⃣ EMI REMINDER:');
  console.log(`
const customerData = {
  name: 'Yogi Faujdar',
  loanId: 'LOAN123',
  vehicleDetails: 'Maruti Swift VXI',
  emiAmount: '12,500',
  dueDate: '20-Jan-2025'
};

await HybridWhatsAppService.sendEMIReminderFlow('916378110608', customerData);
`);

  console.log('\n🎊 PERFECT SOLUTION FOR CAR CREDIT HUB! 🚗💰');
}

main();