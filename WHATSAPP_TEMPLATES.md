# WhatsApp Message Templates for Finonest India

## 📋 Template Categories

### 1. UTILITY Templates (Can be sent anytime)
### 2. MARKETING Templates (Promotional content)
### 3. AUTHENTICATION Templates (OTP, verification)

---

## 🏦 LOAN MANAGEMENT TEMPLATES

### Template 1: Loan Application Received (UTILITY)
**Template Name**: `loan_application_received`
**Category**: UTILITY
**Language**: en_US

**Header**: Text
```
Loan Application Received
```

**Body**:
```
Hello {{1}},

Your loan application has been received successfully!

Application Details:
• Application ID: {{2}}
• Vehicle: {{3}}
• Loan Amount: ₹{{4}}
• Status: Under Review

Our team will review your application and contact you within 24-48 hours.

Thank you for choosing Finonest India!
```

**Footer**:
```
Finonest India - Vehicle Loan Experts
```

**Buttons**:
- Quick Reply: "Check Status"
- Phone Number: "+919462553887" (Call Agent)

---

### Template 2: Document Required (UTILITY)
**Template Name**: `document_required`
**Category**: UTILITY
**Language**: en_US

**Header**: Text
```
Document Required
```

**Body**:
```
Dear {{1}},

We need additional documents for your loan application {{2}}.

Required Document: {{3}}

Please upload the document through our portal or visit our branch.

Application Status: {{4}}
```

**Footer**:
```
Finonest India
```

**Buttons**:
- Quick Reply: "Document Uploaded"
- Phone Number: "+919462553887" (Need Help?)
- URL: "https://finonest.com/upload" (Upload Now)

---

### Template 3: Loan Approved (UTILITY)
**Template Name**: `loan_approved`
**Category**: UTILITY
**Language**: en_US

**Header**: Image + Text
```
🎊 Loan Approved!
```

**Body**:
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

**Footer**:
```
Finonest India
```

**Buttons**:
- Quick Reply: "Thank You"
- Phone Number: "+919462553887" (Call Now)

---

### Template 4: Loan Disbursed (UTILITY)
**Template Name**: `loan_disbursed`
**Category**: UTILITY
**Language**: en_US

**Header**: Text
```
💰 Loan Disbursed Successfully!
```

**Body**:
```
Dear {{1}},

Great news! Your loan has been disbursed.

Disbursement Details:
• Application ID: {{2}}
• Amount: ₹{{3}}
• Account: ***{{4}}
• Date: {{5}}

Your EMI will start from next month. Thank you for choosing Finonest India!
```

**Footer**:
```
Finonest India
```

**Buttons**:
- Quick Reply: "EMI Schedule"
- Phone Number: "+919462553887" (Support)

---

### Template 5: EMI Reminder (UTILITY)
**Template Name**: `emi_reminder`
**Category**: UTILITY
**Language**: en_US

**Header**: Text
```
💳 EMI Payment Reminder
```

**Body**:
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

**Footer**:
```
Finonest India
```

**Buttons**:
- Quick Reply: "Payment Done"
- Phone Number: "+919462553887" (Support)
- URL: "https://finonest.com/payment" (Pay Online)

---

### Template 6: Application Status Update (UTILITY)
**Template Name**: `status_update`
**Category**: UTILITY
**Language**: en_US

**Header**: Text
```
📊 Application Status Update
```

**Body**:
```
Hello {{1}},

Your loan application status has been updated.

Application ID: {{2}}
Previous Status: {{3}}
Current Status: {{4}}
Updated On: {{5}}

{{6}}

We'll keep you updated on further progress.
```

**Footer**:
```
Finonest India
```

**Buttons**:
- Quick Reply: "Got It"
- Phone Number: "+919462553887" (Call Agent)

---

### Template 7: Welcome New Customer (MARKETING)
**Template Name**: `welcome_customer`
**Category**: MARKETING
**Language**: en_US

**Header**: Image
```
[Finonest India Logo]
```

**Body**:
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

**Footer**:
```
Finonest India - Your Trusted Loan Partner
```

**Buttons**:
- Quick Reply: "Apply Now"
- Phone Number: "+919462553887" (Call Us)
- URL: "https://finonest.com" (Visit Website)

---

### Template 8: Loan Rejected (UTILITY)
**Template Name**: `loan_rejected`
**Category**: UTILITY
**Language**: en_US

**Header**: Text
```
Application Update
```

**Body**:
```
Dear {{1}},

We regret to inform you that your loan application {{2}} could not be approved at this time.

Reason: {{3}}

Don't worry! You can reapply after addressing the mentioned concerns. Our team is here to help you improve your eligibility.

Contact us for guidance on reapplication.
```

**Footer**:
```
Finonest India
```

**Buttons**:
- Quick Reply: "Need Help"
- Phone Number: "+919462553887" (Call Agent)

---

### Template 9: OTP Verification (AUTHENTICATION)
**Template Name**: `finonest_otp`
**Category**: AUTHENTICATION
**Language**: en_US

**Body**:
```
*{{1}}* is your verification code for Finonest India.

For your security, do not share this code with anyone.
```

**Footer**:
```
Expires in 5 minutes.
```

**Buttons**:
- URL: Copy Code Button (Auto-generated by WhatsApp)

---

### Template 10: Loan Offer (MARKETING)
**Template Name**: `loan_offer`
**Category**: MARKETING
**Language**: en_US

**Header**: Image
```
[Promotional Banner]
```

**Body**:
```
🌟 Special Loan Offer for {{1}}! 🌟

Pre-approved loan offer just for you:
• Loan Amount: Up to ₹{{2}}
• Interest Rate: Starting {{3}}%
• Processing Fee: Waived*
• Quick Approval: 24 hours

Valid till {{4}}

Don't miss this limited-time offer!
```

**Footer**:
```
*T&C Apply - Finonest India
```

**Buttons**:
- Quick Reply: "Interested"
- Quick Reply: "Not Interested"
- Phone Number: "+919462553887" (Call Now)

---

## 🛠️ Template Implementation Guide

### Step 1: Create Templates in BotBiz Dashboard
1. Login to BotBiz.io dashboard
2. Go to WhatsApp → Templates
3. Create new template with above content
4. Submit for WhatsApp approval

### Step 2: Update Your Code
```javascript
// Example usage in your notification service
await BotBizWhatsAppAPI.sendTemplateMessage(
  customerPhone, 
  'loan_approved', 
  [
    customerName,           // {{1}}
    applicationId,          // {{2}}
    approvedAmount,         // {{3}}
    vehicleDetails,         // {{4}}
    emiAmount,             // {{5}}
    tenure                 // {{6}}
  ]
);
```

### Step 3: Environment Variables
```env
# Add template names to your config
BOTBIZ_TEMPLATES_LOAN_APPROVED=loan_approved
BOTBIZ_TEMPLATES_DOCUMENT_REQUIRED=document_required
BOTBIZ_TEMPLATES_EMI_REMINDER=emi_reminder
```

## 📱 Template Usage Examples

### Loan Approval Notification
```javascript
await sendLoanApprovalTemplate(
  '916378110608',
  'Yogi Faujdar',
  'LOAN123',
  '500000',
  'Maruti Swift',
  '12500',
  '48'
);
```

### Document Request
```javascript
await sendDocumentRequestTemplate(
  '916378110608',
  'Yogi Faujdar',
  'LOAN123',
  'PAN Card',
  'Under Review'
);
```

These templates cover all major loan management scenarios and comply with WhatsApp's template policies! 🚀