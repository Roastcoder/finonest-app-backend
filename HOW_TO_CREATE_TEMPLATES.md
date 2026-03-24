# 📱 How to Create WhatsApp Templates in BotBiz.io

## 🚀 Step-by-Step Guide

### Step 1: Login to BotBiz Dashboard
1. Go to [https://dash.botbiz.io](https://dash.botbiz.io)
2. Login with your credentials
3. Navigate to **WhatsApp** section

### Step 2: Access Template Management
1. Click on **WhatsApp** in the sidebar
2. Select **Templates** or **Message Templates**
3. Click **Create New Template** or **Add Template**

### Step 3: Template Creation Process

#### Basic Template Information
- **Template Name**: Use lowercase with underscores (e.g., `loan_approved`)
- **Language**: Select `English (US)` or `English (GB)`
- **Category**: Choose appropriate category:
  - **UTILITY** - For transactional messages (loan updates, documents)
  - **MARKETING** - For promotional content (offers, welcome messages)
  - **AUTHENTICATION** - For OTP and verification codes

---

## 🏦 Template Examples for Finonest India

### Template 1: Loan Application Received
```
Template Name: loan_application_received
Category: UTILITY
Language: en_US

Header: TEXT
"Loan Application Received"

Body:
Hello {{1}},

Your loan application has been received successfully!

Application Details:
• Application ID: {{2}}
• Vehicle: {{3}}
• Loan Amount: ₹{{4}}
• Status: Under Review

Our team will review your application and contact you within 24-48 hours.

Thank you for choosing Finonest India!

Footer:
Finonest India - Vehicle Loan Experts

Buttons:
- Quick Reply: "Check Status"
- Phone Number: "+919462553887" (Call Agent)
```

### Template 2: Loan Approved
```
Template Name: loan_approved
Category: UTILITY
Language: en_US

Header: TEXT
"🎊 Loan Approved!"

Body:
Congratulations {{1}}!

Your loan has been APPROVED! 🎉

Loan Details:
• Application ID: {{2}}
• Approved Amount: ₹{{3}}
• Vehicle: {{4}}
• EMI: ₹{{5}}/month
• Tenure: {{6}} months

Our executive will contact you for the next steps.

Footer:
Finonest India

Buttons:
- Quick Reply: "Thank You"
- Phone Number: "+919462553887" (Call Now)
```

### Template 3: Document Required
```
Template Name: document_required
Category: UTILITY
Language: en_US

Header: TEXT
"Document Required"

Body:
Dear {{1}},

We need additional documents for your loan application {{2}}.

Required Document: {{3}}

Please upload the document through our portal or visit our branch.

Application Status: {{4}}

Footer:
Finonest India

Buttons:
- Quick Reply: "Document Uploaded"
- Phone Number: "+919462553887" (Need Help?)
- URL: "https://finonest.com/upload" (Upload Now)
```

### Template 4: EMI Reminder
```
Template Name: emi_reminder
Category: UTILITY
Language: en_US

Header: TEXT
"💳 EMI Payment Reminder"

Body:
Dear {{1}},

This is a friendly reminder for your upcoming EMI payment.

Payment Details:
• Loan ID: {{2}}
• EMI Amount: ₹{{3}}
• Due Date: {{4}}
• Account: ***{{5}}

Please ensure timely payment to avoid late charges.

Footer:
Finonest India

Buttons:
- Quick Reply: "Payment Done"
- Phone Number: "+919462553887" (Support)
- URL: "https://finonest.com/payment" (Pay Online)
```

### Template 5: Welcome Customer
```
Template Name: welcome_customer
Category: MARKETING
Language: en_US

Header: IMAGE
[Upload Finonest India Logo]

Body:
Welcome to Finonest India! 🏦

Dear {{1}},

Thank you for choosing us for your vehicle loan needs. We're committed to making your loan journey smooth and hassle-free.

Our Services:
✅ Used Car Loans
✅ New Car Loans  
✅ Loan Against Vehicle
✅ Refinancing Options

Get pre-approved in minutes!

Footer:
Finonest India - Your Trusted Loan Partner

Buttons:
- Quick Reply: "Apply Now"
- Phone Number: "+919462553887" (Call Us)
- URL: "https://finonest.com" (Visit Website)
```

---

## 🛠️ Template Creation Steps in BotBiz

### Step 1: Fill Template Details
1. **Template Name**: Enter template name (e.g., `loan_approved`)
2. **Category**: Select UTILITY/MARKETING/AUTHENTICATION
3. **Language**: Choose English (US)

### Step 2: Design Template Structure

#### Header (Optional)
- **Text**: Simple text header
- **Image**: Upload company logo or relevant image
- **Video**: Upload promotional video
- **Document**: Attach PDF or document

#### Body (Required)
- Write your message content
- Use `{{1}}`, `{{2}}`, `{{3}}` for dynamic variables
- Keep it under 1024 characters
- Use emojis for better engagement

#### Footer (Optional)
- Add company name or disclaimer
- Keep it under 60 characters

#### Buttons (Optional)
- **Quick Reply**: For simple responses
- **Phone Number**: For calling
- **URL**: For website links

### Step 3: Variable Mapping
- Map variables to your data fields:
  - `{{1}}` = Customer Name
  - `{{2}}` = Application ID
  - `{{3}}` = Vehicle Details
  - `{{4}}` = Loan Amount

### Step 4: Submit for Approval
1. Review your template
2. Click **Submit** or **Save**
3. Template goes to WhatsApp for approval
4. Approval takes 24-48 hours

---

## 📋 Template Approval Process

### WhatsApp Review Criteria
- **Clear Purpose**: Template should have clear business purpose
- **No Spam**: Avoid promotional language in UTILITY templates
- **Proper Variables**: Variables should make sense in context
- **Compliance**: Follow WhatsApp Business Policy

### Approval Timeline
- **UTILITY Templates**: 24-48 hours
- **MARKETING Templates**: 48-72 hours
- **AUTHENTICATION Templates**: 24 hours

### Common Rejection Reasons
- ❌ Too promotional for UTILITY category
- ❌ Unclear variable usage
- ❌ Policy violations
- ❌ Poor formatting

---

## 🎯 Best Practices

### Template Design
1. **Keep it Simple**: Clear, concise messaging
2. **Use Variables**: Make templates reusable
3. **Add Value**: Provide useful information
4. **Include CTAs**: Clear call-to-action buttons
5. **Brand Consistency**: Use company name and style

### Variable Usage
- Use meaningful variable names in examples
- Don't exceed 10 variables per template
- Test with real data before submission

### Content Guidelines
- **UTILITY**: Transactional, informational content
- **MARKETING**: Promotional, offers, welcome messages
- **AUTHENTICATION**: OTP, verification codes only

---

## 🧪 Testing Templates

### After Approval
1. Go to **Templates** section
2. Find your approved template
3. Click **Test** or **Send Test**
4. Enter test phone number
5. Fill in variable values
6. Send test message

### Using API
```javascript
// Test with your API
await BotBizWhatsAppAPI.sendTemplateMessage(
  '916378110608',
  'loan_approved',
  [
    'Yogi Faujdar',     // {{1}} - Customer Name
    'LOAN123',          // {{2}} - Application ID
    '500000',           // {{3}} - Approved Amount
    'Maruti Swift',     // {{4}} - Vehicle
    '12500',            // {{5}} - EMI Amount
    '48'                // {{6}} - Tenure
  ]
);
```

---

## 📞 Support

### BotBiz Support
- **Email**: support@botbiz.io
- **Chat**: Available in dashboard
- **Documentation**: Check BotBiz help section

### Template Issues
- Check approval status in dashboard
- Review rejection reasons if any
- Modify and resubmit if needed

---

## 🚀 Quick Start Checklist

- [ ] Login to BotBiz dashboard
- [ ] Navigate to Templates section
- [ ] Create `loan_approved` template first
- [ ] Submit for WhatsApp approval
- [ ] Wait for approval (24-48 hours)
- [ ] Test template with your phone number
- [ ] Integrate with your Finonest API
- [ ] Create remaining templates

Your WhatsApp template system will be ready to send professional loan notifications! 🎉