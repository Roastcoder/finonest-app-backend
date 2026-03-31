import fetch from 'node-fetch';

const API = 'http://localhost:5001/api';

async function testBanksEndpoint() {
  try {
    console.log('Testing /api/banks endpoint...\n');

    const response = await fetch(`${API}/banks`, {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIn0.test`
      }
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testBanksEndpoint();
