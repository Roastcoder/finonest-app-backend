import fetch from 'node-fetch';

const API = 'http://localhost:5001/api';

async function testSearch() {
  try {
    console.log('🔍 Testing Find Lender API...\n');

    // Get auth token (you may need to update this)
    const loginResponse = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;

    if (!token) {
      console.log('❌ Could not get auth token. Please check credentials.');
      process.exit(1);
    }

    console.log('✅ Got auth token\n');

    // Search for lenders
    const searchResponse = await fetch(`${API}/find-lender/search-by-address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        address: 'Jaipur',
        case_type: null
      })
    });

    const searchData = await searchResponse.json();

    console.log('📊 API Response:\n');
    console.log(JSON.stringify(searchData, null, 2));

    if (searchData.lenders && searchData.lenders.length > 0) {
      console.log('\n🔍 Checking first branch coordinates:\n');
      const firstBranch = searchData.lenders[0].branches[0];
      console.log(`Branch: ${firstBranch.branch_name}`);
      console.log(`Latitude: ${firstBranch.latitude} (type: ${typeof firstBranch.latitude})`);
      console.log(`Longitude: ${firstBranch.longitude} (type: ${typeof firstBranch.longitude})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSearch();
