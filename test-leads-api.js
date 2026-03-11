import fetch from 'node-fetch';

async function testLeadsAPI() {
  try {
    // You'll need to replace this with a valid auth token
    const response = await fetch('http://localhost:5000/api/leads', {
      headers: {
        'Authorization': 'Bearer YOUR_AUTH_TOKEN_HERE'
      }
    });
    
    if (!response.ok) {
      console.log('API Response Status:', response.status);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }
    
    const leads = await response.json();
    console.log('Number of leads:', leads.length);
    
    if (leads.length > 0) {
      console.log('Sample lead data:');
      console.log('Fields available:', Object.keys(leads[0]));
      console.log('First lead:', JSON.stringify(leads[0], null, 2));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLeadsAPI();