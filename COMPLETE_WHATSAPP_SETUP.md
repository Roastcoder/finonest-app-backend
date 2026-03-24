# BotBiz.io WhatsApp Setup - Finonest India

## ✅ Your Credentials
- **API Token**: `15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07`
- **WhatsApp Number**: `917357302124`

## 🔧 Environment Variables
Add these to your `.env` file:

```env
# BotBiz.io WhatsApp Business API Configuration
BOTBIZ_API_TOKEN=15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07
BOTBIZ_PHONE_NUMBER_ID=your_phone_number_id_here
BOTBIZ_WHATSAPP_BOT_ID=your_whatsapp_bot_id_here

# For one-time account connection setup (get from BotBiz dashboard)
BOTBIZ_USER_ID=your_user_id_here
BOTBIZ_WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id_here
BOTBIZ_ACCESS_TOKEN=your_access_token_here

BASE_URL=https://your-domain.com
```

## 📋 What You Still Need from BotBiz Dashboard

1. **PHONE_NUMBER_ID** - Your WhatsApp phone number ID (most important)
2. **WHATSAPP_BOT_ID** - Your bot ID for message tracking
3. **USER_ID** - Your BotBiz user ID
4. **WHATSAPP_BUSINESS_ACCOUNT_ID** - Your WhatsApp Business Account ID
5. **ACCESS_TOKEN** - Your WhatsApp access token

## 🚀 Setup Steps

### Step 1: Get Missing Credentials
1. Login to [BotBiz.io Dashboard](https://dash.botbiz.io)
2. Go to WhatsApp section
3. Find your Phone Number ID and other credentials
4. Update your `.env` file

### Step 2: Connect Account (One-time)
```bash
# Run the connection script
node src/utils/botbizConnection.js connect

# Or manual curl command
curl -X POST 'https://dash.botbiz.io/api/v1/whatsapp/account/connect' \
  -d 'apiToken=15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07' \
  -d 'user_id=YOUR_USER_ID' \
  -d 'whatsapp_business_account_id=YOUR_WHATSAPP_BUSINESS_ACCOUNT_ID' \
  -d 'access_token=YOUR_ACCESS_TOKEN'
```

### Step 3: Test Integration
```bash
# Check API status
curl -X GET 'http://localhost:5000/api/whatsapp/status'

# Send test message to your number
curl -X POST 'http://localhost:5000/api/whatsapp/send' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "917357302124",
    "message": "🎉 Hello from Finonest India! WhatsApp integration is working!"
  }'
```

## 📱 Test Messages

### Test Loan Application Message
```json
{
  "phone": "917357302124",
  "message": "*Finonest India - Loan Application*\n\n*ID:* LOAN123\n*Applicant:* Test Customer\n*Mobile:* 917357302124\n*Vehicle:* Maruti Swift\n*Loan Amount:* ₹5,00,000\n*Status:* approved\n*EMI:* ₹12,500\n*Tenure:* 48 months\n\nThank you for choosing Finonest India!"
}
```

### Test Document Sharing
The system will automatically:
1. Generate PDF with loan details
2. Fetch all uploaded documents
3. Send via WhatsApp with attachments

## 🔍 Available Features

- ✅ Send text messages
- ✅ Send loan notifications
- ✅ Send documents/PDFs
- ✅ Customer notifications
- ✅ Staff notifications
- ✅ Template messages
- ✅ Conversation history
- ✅ Message delivery status

## 🎯 Next Actions

1. **Get credentials** from BotBiz dashboard
2. **Update .env file** with all variables
3. **Run connection script** to link account
4. **Test messaging** with your number
5. **Deploy and enjoy** WhatsApp integration!

Your API key is already configured and ready to use! 🚀