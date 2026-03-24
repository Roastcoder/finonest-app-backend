# BotBiz.io WhatsApp Integration Setup

## 🚀 Quick Setup Guide

### 1. **Environment Variables**
Add these to your `.env` file:

```env
# BotBiz.io WhatsApp Business API Configuration
BOTBIZ_API_TOKEN=15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07
BOTBIZ_PHONE_NUMBER_ID=your_phone_number_id_here
BOTBIZ_WHATSAPP_BOT_ID=your_whatsapp_bot_id_here

# For one-time account connection setup
BOTBIZ_USER_ID=your_user_id_here
BOTBIZ_WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id_here
BOTBIZ_ACCESS_TOKEN=your_access_token_here

BASE_URL=https://your-domain.com
```

### 2. **Get Missing Credentials**
You need to get from BotBiz.io dashboard:
- `PHONE_NUMBER_ID` - Your WhatsApp phone number ID (most important)
- `WHATSAPP_BOT_ID` - Your bot ID for message status tracking
- `USER_ID` - Your BotBiz user ID (for account connection)
- `WHATSAPP_BUSINESS_ACCOUNT_ID` - Your WhatsApp Business Account ID
- `ACCESS_TOKEN` - Your WhatsApp access token

### 3. **Connect WhatsApp Account (One-time)**
Run the connection script:

```bash
# Using the utility script
node src/utils/botbizConnection.js connect

# Or manual curl command
curl -X POST 'https://dash.botbiz.io/api/v1/whatsapp/account/connect' \
  -d 'apiToken=15634|fwHpJLy4NPvVFFIJRXVHYkIdIASDRuQBkf6MWy6g4a94fd07' \
  -d 'user_id=YOUR_USER_ID' \
  -d 'whatsapp_business_account_id=YOUR_WHATSAPP_BUSINESS_ACCOUNT_ID' \
  -d 'access_token=YOUR_ACCESS_TOKEN'
```

### 4. **Test Integration**
Once configured, test with:

```bash
# Check status
GET /api/whatsapp/status

# Send test message
POST /api/whatsapp/send
{
  "phone": "919876543210",
  "message": "Test message from Finonest"
}
```

### 5. **Available BotBiz Features**
- ✅ Send text messages
- ✅ Send template messages
- ✅ Send documents/PDFs
- ✅ Get conversation history
- ✅ Check message delivery status
- ✅ Get subscriber information
- ✅ Trigger bot flows
- ✅ Get template list

### 6. **API Endpoints**
- `POST /api/whatsapp/send` - Send text message
- `POST /api/whatsapp/send-document` - Send document
- `POST /api/whatsapp/send-loan-notification` - Send loan-specific notifications
- `GET /api/whatsapp/status` - Check API status
- `GET /api/whatsapp/templates` - Get available templates
- `GET /api/whatsapp/conversation/:phone` - Get conversation history

### 7. **Phone Number Format**
BotBiz requires phone numbers in this format:
- ✅ `919876543210` (country code + number, no +)
- ❌ `+919876543210` (no + sign)
- ❌ `9876543210` (missing country code)

### 8. **Message Templates**
BotBiz supports pre-approved templates:
- `promo_offer` [Marketing]
- `newucl` [Utility]
- `data_rc` [Utility]
- `new_year_greetings` [Marketing]
- `cc_offer` [Marketing]
- `testing` [Marketing]
- `demo` [Marketing]

### 9. **Error Handling**
Common responses:
- `{"status":"1","message":"Message sent successfully."}` - Success
- `{"status":"0","message":"Subscriber limit exceeded"}` - Limit reached
- Check message delivery status with `wa_message_id`

### 10. **Production Checklist**
- [ ] All environment variables set
- [ ] Account connected successfully
- [ ] Phone number ID verified
- [ ] Test message sent successfully
- [ ] Document sending tested
- [ ] Webhook configured (if needed)
- [ ] Message templates approved

The integration is now ready to use BotBiz.io's WhatsApp Business API!