import fetch from 'node-fetch';

async function testSignupWithUniquePhone() {
  try {
    console.log('Testing signup with unique phone number...');
    
    // Generate a random phone number
    const randomPhone = '98' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    const signupData = {
      name: "New Test User",
      phone: randomPhone,
      password: "1234",
      role: "executive",
      refer_code: "",
      pan_number: "NEWPA1234N",
      aadhaar_number: "987654321098",
      pan_data: {
        full_name: "New Test User",
        dob: "1995-01-01"
      },
      aadhaar_data: {
        full_name: "New Test User",
        date_of_birth: "1995-01-01"
      },
      photo_path: null
    };
    
    console.log('Using phone number:', randomPhone);
    console.log('Sending signup request...');
    
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Signup successful with unique phone number!');
      const data = JSON.parse(responseText);
      console.log('Created user:', data.user);
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

testSignupWithUniquePhone();