import fetch from 'node-fetch';

async function testSignupAPI() {
  try {
    console.log('Testing signup API...');
    
    const signupData = {
      name: "Test User",
      phone: "9876543210",
      password: "1234",
      role: "executive",
      refer_code: "",
      pan_number: "ABCDE1234F",
      aadhaar_number: "123456789012",
      pan_data: {
        full_name: "Test User",
        dob: "1990-01-01"
      },
      aadhaar_data: {
        full_name: "Test User",
        date_of_birth: "1990-01-01"
      },
      photo_path: null
    };
    
    console.log('Sending signup request with:', JSON.stringify(signupData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Signup successful!');
    } else {
      console.log('❌ Signup failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Network/Request error:', error.message);
  }
}

testSignupAPI();