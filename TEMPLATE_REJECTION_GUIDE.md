# 🚫 WhatsApp Template Rejection Guide - How to Get Approved

## 📋 Common Rejection Reasons & Solutions

### 1. **Category Mismatch**
**❌ Problem:** Using MARKETING category for transactional messages
**✅ Solution:** Use correct categories:
- **UTILITY** - Loan updates, document requests, EMI reminders
- **MARKETING** - Welcome messages, offers, promotions
- **AUTHENTICATION** - OTP codes only

### 2. **Variable Issues**
**❌ Problem:** Variables don't make sense or are unclear
**✅ Solution:** Use meaningful variable examples:
```
Bad: {{1}} {{2}} {{3}}
Good: {{customer_name}} {{loan_id}} {{amount}}
```

### 3. **Too Promotional in UTILITY**
**❌ Problem:** Using sales language in UTILITY templates
**✅ Solution:** Keep UTILITY templates informational only

### 4. **Missing Business Context**
**❌ Problem:** Generic templates without clear business purpose
**✅ Solution:** Make it clear this is for loan management

---

## ✅ APPROVED Template Examples for Finonest

### Template 1: Loan Status Update (UTILITY)
```
Template Name: loan_status_update
Category: UTILITY
Language: en_US

Body:
Hello {{1}},

Your loan application status has been updated.

Application ID: {{2}}
Current Status: {{3}}
Next Step: {{4}}

For any queries, please contact us.

Thank you,
Finonest India

Example Variables:
{{1}} = John Doe
{{2}} = LOAN12345
{{3}} = Document Verification
{{4}} = Submit PAN Card
```

### Template 2: Document Submission (UTILITY)
```
Template Name: document_submission
Category: UTILITY
Language: en_US

Body:
Dear {{1}},

We have received your document for loan application {{2}}.

Document: {{3}}
Status: {{4}}
Submitted on: {{5}}

We will review and update you shortly.

Regards,
Finonest India

Example Variables:
{{1}} = John Doe
{{2}} = LOAN12345
{{3}} = Aadhar Card
{{4}} = Under Review
{{5}} = 15-Jan-2024
```

### Template 3: Payment Reminder (UTILITY)
```
Template Name: payment_reminder
Category: UTILITY
Language: en_US

Body:
Dear {{1}},

This is a reminder for your loan payment.

Loan ID: {{2}}
Amount Due: Rs {{3}}
Due Date: {{4}}

Please make the payment to avoid late charges.

Finonest India

Example Variables:
{{1}} = John Doe
{{2}} = LOAN12345
{{3}} = 15000
{{4}} = 20-Jan-2024
```

### Template 4: Welcome Message (MARKETING)
```
Template Name: customer_welcome
Category: MARKETING
Language: en_US

Body:
Welcome to Finonest India, {{1}}!

Thank you for choosing us for your vehicle financing needs.

We are committed to providing you with the best loan solutions.

Our team will assist you throughout the process.

Best regards,
Finonest India Team

Example Variables:
{{1}} = John Doe
```

---

## 🛠️ Template Creation Best Practices

### 1. **Use Simple, Clear Language**
- Avoid complex sentences
- Use professional tone
- No slang or informal language

### 2. **Proper Variable Usage**
- Maximum 10 variables per template
- Use descriptive variable names in examples
- Ensure variables fit naturally in sentences

### 3. **Business Context**
- Always mention "Finonest India"
- Make the business purpose clear
- Include relevant contact information

### 4. **Category Guidelines**

#### UTILITY Templates Should:
- ✅ Provide transaction updates
- ✅ Share account information
- ✅ Send service notifications
- ✅ Request required actions
- ❌ NOT include promotional content
- ❌ NOT use sales language

#### MARKETING Templates Should:
- ✅ Welcome new customers
- ✅ Share offers and promotions
- ✅ Announce new services
- ❌ NOT include transactional info
- ❌ NOT be used for urgent updates

---

## 🔄 Resubmission Strategy

### Step 1: Analyze Rejection Reason
Check your BotBiz dashboard for specific rejection feedback:
- Policy violation
- Category mismatch
- Variable issues
- Content problems

### Step 2: Fix Common Issues
```javascript
// Check your current templates
node templateHelper.js status
```

### Step 3: Create Compliant Version
Use the approved examples above as templates

### Step 4: Test Before Submission
- Review all variables
- Check category selection
- Ensure business context is clear

---

## 📱 Immediate Action Plan

### Create These 4 Templates First:

#### 1. **Loan Status Update** (UTILITY)
- Simple status notifications
- Clear business purpose
- No promotional content

#### 2. **Document Request** (UTILITY)
- Request specific documents
- Professional tone
- Clear next steps

#### 3. **Payment Reminder** (UTILITY)
- Payment due notifications
- Include essential details
- Professional reminder

#### 4. **Customer Welcome** (MARKETING)
- Welcome new customers
- Introduce your services
- Build relationship

---

## 🎯 Template Submission Checklist

Before submitting any template:

- [ ] **Category is correct** (UTILITY for transactions, MARKETING for promotions)
- [ ] **Variables make sense** (use real examples in variable mapping)
- [ ] **Business name included** (Finonest India mentioned)
- [ ] **Professional tone** (no casual language)
- [ ] **Clear purpose** (obvious why customer receives this)
- [ ] **No policy violations** (no spam, threats, or inappropriate content)
- [ ] **Proper formatting** (clean, readable structure)
- [ ] **Contact info included** (phone number or company name)

---

## 🚀 Quick Fix Templates (High Approval Rate)

### Simple Loan Confirmation (UTILITY)
```
Hello {{1}},

Your loan application {{2}} has been received.

Status: Under Review
Amount: Rs {{3}}

We will update you within 2 business days.

Finonest India
```

### Document Received (UTILITY)
```
Dear {{1}},

We have received your {{2}} for application {{3}}.

Status: Verification in progress

Thank you for your submission.

Finonest India
```

### Payment Confirmation (UTILITY)
```
Hello {{1}},

Your payment of Rs {{2}} for loan {{3}} has been received.

Payment Date: {{4}}
Next Due: {{5}}

Thank you,
Finonest India
```

---

## 📞 Support & Next Steps

### If Templates Keep Getting Rejected:
1. **Contact BotBiz Support** - Ask for specific feedback
2. **Use Existing Templates** - Modify approved templates like `promo_offer`
3. **Start Simple** - Create basic notification templates first
4. **Copy Successful Patterns** - Use templates from similar businesses

### Alternative Approach:
Use your existing approved templates (`promo_offer`, `new_year_greetings`) and modify the content through your API parameters until new templates are approved.

### Test Current Setup:
```bash
# Test with existing approved templates
node templateHelper.js test
```

The key is to start simple, be very clear about business purpose, and avoid any promotional language in UTILITY templates! 🎯