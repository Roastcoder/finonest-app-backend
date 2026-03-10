import fetch from 'node-fetch';

async function testLogin() {
  try {
    const response = await fetch('https://appbackend.finonest.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@finonest.com',
        password: 'test123'
      })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✓ Login successful');
    } else {
      console.log('✗ Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();