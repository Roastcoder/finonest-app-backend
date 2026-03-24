# 🔄 BotBiz Template Variable Mapping Guide

## 📋 Two Options for Variable Mapping

### Option 1: Manual Variable Mapping
- You define custom variable names in BotBiz dashboard
- Map each variable to specific data fields
- More control but requires setup

### Option 2: Auto Mapping (Recommended)
- BotBiz automatically maps variables in order
- No manual setup required
- Variables are mapped by position: {{1}}, {{2}}, {{3}}, etc.

---

## ✅ **Auto Mapping (Easiest Method)**

### How Auto Mapping Works
1. **Template Creation**: Use {{1}}, {{2}}, {{3}} in your template
2. **API Call**: Send parameters in array order
3. **Auto Assignment**: BotBiz maps parameters automatically

### Example Template with Auto Mapping

**Template Body:**
```
Congratulations {{1}}!

Your loan has been APPROVED! 🎉

Loan Details:
• Application ID: {{2}}
• Approved Amount: ₹{{3}}
• Vehicle: {{4}}
• EMI: ₹{{5}}/month
• Tenure: {{6}} months

Our executive will contact you for the next steps.
```

**API Call:**
```javascript
await BotBizWhatsAppAPI.sendTemplateMessage(
  '916378110608',
  'loan_approved',
  [
    'Yogi Faujdar',    // {{1}} - Customer Name
    'LOAN123',         // {{2}} - Application ID  
    '500000',          // {{3}} - Approved Amount
    'Maruti Swift',    // {{4}} - Vehicle
    '12500',           // {{5}} - EMI Amount
    '48'               // {{6}} - Tenure
  ]
);
```

**Result Message:**
```
Congratulations Yogi Faujdar!

Your loan has been APPROVED! 🎉

Loan Details:
• Application ID: LOAN123
• Approved Amount: ₹500000
• Vehicle: Maruti Swift
• EMI: ₹12500/month
• Tenure: 48 months

Our executive will contact you for the next steps.
```

---

## 🎯 **Template Creation with Auto Mapping**

### Step 1: Create Template in BotBiz Dashboard
1. Go to **Templates** section
2. Click **Create New Template**
3. Fill in details:

**Template Name:** `loan_approved`
**Category:** UTILITY
**Language:** en_US

**Body Text:**
```
Congratulations {{1}}!

Your loan has been APPROVED! 🎉

Loan Details:
• Application ID: {{2}}
• Approved Amount: ₹{{3}}
• Vehicle: {{4}}
• EMI: ₹{{5}}/month
• Tenure: {{6}} months

Our executive will contact you for the next steps.
```

### Step 2: Provide Example Values
In the **Example** section, provide sample values:
- {{1}} = John Doe
- {{2}} = LOAN123
- {{3}} = 500000
- {{4}} = Honda City
- {{5}} = 12500
- {{6}} = 48

### Step 3: Submit for Approval
- Click **Submit**
- Wait for WhatsApp approval (24-48 hours)
- No variable mapping setup needed!

---

## 🔧 **Using Auto-Mapped Templates in Your Code**

### Update Your Template Service
```javascript
// In finonestTemplateService.js
async sendLoanApproved(leadId, customerName, approvedAmount, vehicleDetails, emiAmount, tenure) {
  try {
    const customerPhone = await this.getCustomerPhone(leadId);
    if (!customerPhone) return;

    // Auto mapping - parameters sent in order
    await BotBizWhatsAppAPI.sendTemplateMessage(
      customerPhone,
      'loan_approved',
      [
        customerName,                    // {{1}}
        leadId,                         // {{2}}
        approvedAmount.toLocaleString(), // {{3}}
        vehicleDetails,                 // {{4}}
        emiAmount.toLocaleString(),     // {{5}}
        tenure.toString()               // {{6}}
      ]
    );
  } catch (error) {
    console.error('Template send error (loan_approved):', error);
  }
}
```

### API Endpoint Usage
```javascript
// Send loan approval notification
POST /api/templates/loan-approved
{
  "leadId": "LOAN123",
  "customerName": "Yogi Faujdar",
  "approvedAmount": 500000,
  "vehicleDetails": "Maruti Swift VXI",
  "emiAmount": 12500,
  "tenure": 48
}
```

---

## 📱 **Complete Template Examples with Auto Mapping**

### Template 1: Document Required
**Template Body:**
```
Dear {{1}},

We need additional documents for your loan application {{2}}.

Required Document: {{3}}

Please upload the document through our portal or visit our branch.

Application Status: {{4}}
```

**API Parameters:**
```javascript
[
  'Yogi Faujdar',    // {{1}} - Customer Name
  'LOAN123',         // {{2}} - Application ID
  'PAN Card',        // {{3}} - Document Type
  'Under Review'     // {{4}} - Current Status
]
```

### Template 2: EMI Reminder
**Template Body:**
```
Dear {{1}},

This is a friendly reminder for your upcoming EMI payment.

Payment Details:
• Loan ID: {{2}}
• EMI Amount: ₹{{3}}
• Due Date: {{4}}
• Account: ***{{5}}

Please ensure timely payment to avoid late charges.
```

**API Parameters:**
```javascript
[
  'Yogi Faujdar',    // {{1}} - Customer Name
  'LOAN123',         // {{2}} - Loan ID
  '12500',           // {{3}} - EMI Amount
  '15-Jan-2024',     // {{4}} - Due Date
  '1234'             // {{5}} - Last 4 digits of account
]
```

### Template 3: Welcome Customer
**Template Body:**
```
Welcome to Finonest India! 🏦

Dear {{1}},

Thank you for choosing us for your vehicle loan needs. We're committed to making your loan journey smooth and hassle-free.

Our Services:
✅ Used Car Loans
✅ New Car Loans  
✅ Loan Against Vehicle
✅ Refinancing Options

Get pre-approved in minutes!
```

**API Parameters:**
```javascript
[
  'Yogi Faujdar'     // {{1}} - Customer Name
]
```

---

## ✅ **Advantages of Auto Mapping**

### Pros:
- ✅ **No Setup Required** - Just use {{1}}, {{2}}, {{3}}
- ✅ **Simple to Implement** - Parameters sent in array order
- ✅ **Less Configuration** - No variable mapping in dashboard
- ✅ **Quick Deployment** - Templates work immediately after approval

### Cons:
- ❌ **Order Dependent** - Must send parameters in exact order
- ❌ **Less Readable** - {{1}} is less clear than {{customerName}}

---

## 🚀 **Quick Start with Auto Mapping**

### Step 1: Create Template
Use this exact format in BotBiz dashboard:
```
Template Name: loan_approved
Body: Congratulations {{1}}! Your loan {{2}} for ₹{{3}} is approved!
Example: {{1}}=John, {{2}}=LOAN123, {{3}}=500000
```

### Step 2: Use in Code
```javascript
await BotBizWhatsAppAPI.sendTemplateMessage(
  '916378110608',
  'loan_approved',
  ['Yogi Faujdar', 'LOAN123', '500000']
);
```

### Step 3: Test
```bash
node templateHelper.js test
```

**Auto mapping is the recommended approach for Finonest India templates!** 🎯

It's simpler, requires no additional configuration, and works perfectly with your existing API structure.