# 🔧 WhatsApp Template Variable Mapping Guide

## 📋 Variable Mapping Options in BotBiz.io

### **Option 1: Manual Variable Mapping (Recommended)**

#### When Creating Template:
1. **Write your template body** with variables like `{{1}}`, `{{2}}`, `{{3}}`
2. **In the "Variable Mapping" section**, define what each variable represents
3. **Provide example values** for WhatsApp approval

#### Example for `loan_approved` template:

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
```

**Variable Mapping:**
- `{{1}}` = Customer Name (Example: "Yogi Faujdar")
- `{{2}}` = Application ID (Example: "LOAN123")
- `{{3}}` = Approved Amount (Example: "500000")
- `{{4}}` = Vehicle Details (Example: "Maruti Swift")
- `{{5}}` = EMI Amount (Example: "12500")
- `{{6}}` = Tenure (Example: "48")

---

### **Option 2: Auto Mapping with Field Names**

#### When Creating Template:
1. **Use descriptive field names** instead of numbers
2. **BotBiz maps automatically** to your data fields
3. **Less flexible** but easier for simple cases

#### Example with Auto Mapping:
```
Congratulations {{customer_name}}!

Your loan has been APPROVED! 🎉

Loan Details:
• Application ID: {{application_id}}
• Approved Amount: ₹{{approved_amount}}
• Vehicle: {{vehicle_details}}
• EMI: ₹{{emi_amount}}/month
• Tenure: {{tenure}} months
```

---

## 🎯 **Recommended Approach for Finonest**

### **Use Manual Variable Mapping ({{1}}, {{2}}, {{3}})**

**Why?**
- ✅ **More Control** - You decide exact parameter order
- ✅ **API Friendly** - Easy to pass parameters in array format
- ✅ **Flexible** - Works with any data structure
- ✅ **WhatsApp Standard** - Follows WhatsApp's recommended format

### **Template Creation Steps:**

#### **Step 1: Create Template Structure**
```
Template Name: loan_approved
Category: UTILITY
Language: en_US

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
```

#### **Step 2: Define Variable Mapping**
In BotBiz dashboard, map each variable:

| Variable | Field Name | Example Value | Description |
|----------|------------|---------------|-------------|
| {{1}} | customer_name | Yogi Faujdar | Customer's full name |
| {{2}} | application_id | LOAN123 | Unique loan application ID |
| {{3}} | approved_amount | 500000 | Approved loan amount |
| {{4}} | vehicle_details | Maruti Swift | Vehicle make and model |
| {{5}} | emi_amount | 12500 | Monthly EMI amount |
| {{6}} | tenure | 48 | Loan tenure in months |

#### **Step 3: Set Example Values**
Provide realistic example values for WhatsApp approval:
```json
{
  "body_text": [
    [
      "Yogi Faujdar",
      "LOAN123", 
      "500000",
      "Maruti Swift",
      "12500",
      "48"
    ]
  ]
}
```

---

## 🔧 **Implementation in Your Code**

### **With Manual Mapping (Recommended):**
```javascript
// Easy to use with your existing service
await BotBizWhatsAppAPI.sendTemplateMessage(
  customerPhone,
  'loan_approved',
  [
    customerName,        // {{1}}
    applicationId,       // {{2}}
    approvedAmount,      // {{3}}
    vehicleDetails,      // {{4}}
    emiAmount,          // {{5}}
    tenure              // {{6}}
  ]
);
```

### **With Auto Mapping:**
```javascript
// More complex - need to match field names exactly
await BotBizWhatsAppAPI.sendTemplateMessage(
  customerPhone,
  'loan_approved',
  {
    customer_name: customerName,
    application_id: applicationId,
    approved_amount: approvedAmount,
    vehicle_details: vehicleDetails,
    emi_amount: emiAmount,
    tenure: tenure
  }
);
```

---

## 📱 **BotBiz Dashboard Configuration**

### **In Template Creation Form:**

#### **1. Template Details**
- **Name**: `loan_approved`
- **Category**: `UTILITY`
- **Language**: `en_US`

#### **2. Template Content**
- **Header**: `🎊 Loan Approved!`
- **Body**: (Use {{1}}, {{2}}, etc.)
- **Footer**: `Finonest India`

#### **3. Variable Mapping Section**
- **Map Needed**: `Yes` or `No`
- **Variable Map**: Define each {{1}}, {{2}}, etc.

#### **4. Example Values**
- Provide sample data for each variable
- This helps WhatsApp understand your template

---

## 🎯 **Template Examples for Finonest**

### **1. Loan Approved Template**
```
Variables: {{1}} to {{6}}
Mapping:
- {{1}} = Customer Name
- {{2}} = Application ID  
- {{3}} = Approved Amount
- {{4}} = Vehicle Details
- {{5}} = EMI Amount
- {{6}} = Tenure
```

### **2. Document Required Template**
```
Variables: {{1}} to {{4}}
Mapping:
- {{1}} = Customer Name
- {{2}} = Application ID
- {{3}} = Document Type
- {{4}} = Current Status
```

### **3. EMI Reminder Template**
```
Variables: {{1}} to {{5}}
Mapping:
- {{1}} = Customer Name
- {{2}} = Loan ID
- {{3}} = EMI Amount
- {{4}} = Due Date
- {{5}} = Account Number (last 4 digits)
```

---

## ✅ **Quick Setup Checklist**

- [ ] Choose **Manual Variable Mapping** ({{1}}, {{2}}, {{3}})
- [ ] Create template with numbered variables
- [ ] Define clear variable mapping in BotBiz
- [ ] Provide realistic example values
- [ ] Submit for WhatsApp approval
- [ ] Test with your phone number after approval
- [ ] Update your code to pass parameters in correct order

---

## 🚀 **Ready-to-Use Template Code**

```javascript
// Your Finonest template service will work like this:
await FinonestTemplateService.sendLoanApproved(
  'LOAN123',           // leadId
  'Yogi Faujdar',      // customerName  
  500000,              // approvedAmount
  'Maruti Swift',      // vehicleDetails
  12500,               // emiAmount
  48                   // tenure
);

// Which internally calls:
await BotBizWhatsAppAPI.sendTemplateMessage(
  '916378110608',      // phone
  'loan_approved',     // template name
  [                    // parameters array
    'Yogi Faujdar',    // {{1}}
    'LOAN123',         // {{2}}
    '500000',          // {{3}}
    'Maruti Swift',    // {{4}}
    '12500',           // {{5}}
    '48'               // {{6}}
  ]
);
```

**Recommendation**: Use **Manual Variable Mapping** with numbered variables ({{1}}, {{2}}, {{3}}) for maximum flexibility and easier API integration! 🎯