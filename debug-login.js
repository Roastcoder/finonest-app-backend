import fetch from 'node-fetch';

async function testLoginAPI() {
  try {
    console.log('Testing login API call...');
    
    const loginData = {
      email: '9999999999@finonest.temp',
      password: '1234'
    };
    
    console.log('Sending login request with:', loginData);
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Login successful!');
      console.log('User:', data.user);
      console.log('Token present:', !!data.token);
    } else {
      console.log('❌ Login failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error:', errorData);
      } catch (e) {
        console.log('Raw error:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testLoginAPI();