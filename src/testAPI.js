import fetch from 'node-fetch';

const testAPI = async () => {
  try {
    console.log('🔄 Testing API endpoints...\n');
    
    // You need to replace these with actual values
    const token = 'YOUR_AUTH_TOKEN'; // Get this from login
    const baseURL = 'http://localhost:5001/api';
    
    console.log('Testing /users/my-team/hierarchy endpoint...');
    const response = await fetch(`${baseURL}/users/my-team/hierarchy`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response received:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check if refer_code is present
      if (data.length > 0 && data[0].refer_code) {
        console.log('\n✅ refer_code is present in the response!');
      } else {
        console.log('\n⚠️ refer_code is NOT present in the response');
      }
    } else {
      console.log(`❌ API returned status ${response.status}`);
      console.log(await response.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testAPI();
