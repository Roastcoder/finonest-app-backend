# Test Configuration for BotBiz.io WhatsApp Integration

## Your WhatsApp Details
- **Mobile Number**: 917357302124
- **Formatted for BotBiz**: 917357302124 (no + sign required)

## Environment Variables Template
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

## Test Commands

### 1. Test Message Send
```bash
curl -X POST 'http://localhost:5000/api/whatsapp/send' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "phone": "917357302124",
    "message": "🎉 Test message from Finonest India! Your WhatsApp integration is working perfectly."
  }'
```

### 2. Test Loan Notification
```bash
curl -X POST 'http://localhost:5000/api/whatsapp/send-loan-notification' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -d '{
    "leadId": "TEST123",
    "type": "application_confirmation",
    "data": {}
  }'
```

### 3. Check API Status
```bash
curl -X GET 'http://localhost:5000/api/whatsapp/status' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Next Steps
1. Get your BotBiz.io credentials from dashboard
2. Add them to your `.env` file
3. Run the connection script: `node src/utils/botbizConnection.js connect`
4. Test with the above commands

## Phone Number Format Notes
- ✅ Use: `917357302124` (country code + number)
- ❌ Don't use: `+917357302124` (no + sign)
- ❌ Don't use: `7357302124` (missing country code)