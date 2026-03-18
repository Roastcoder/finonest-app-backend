import axios from 'axios';

// One-time account connection utility
export async function connectBotBizAccount() {
  try {
    const response = await axios.post(
      'https://dash.botbiz.io/api/v1/whatsapp/account/connect',
      {
        apiToken: process.env.BOTBIZ_API_TOKEN,
        user_id: process.env.BOTBIZ_USER_ID,
        whatsapp_business_account_id: process.env.BOTBIZ_WHATSAPP_BUSINESS_ACCOUNT_ID,
        access_token: process.env.BOTBIZ_ACCESS_TOKEN
      }
    );
    
    console.log('BotBiz Account Connection Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('BotBiz Account Connection Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test the connection
if (process.argv[2] === 'connect') {
  connectBotBizAccount()
    .then(result => {
      console.log('✅ Account connected successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Account connection failed:', error);
      process.exit(1);
    });
}