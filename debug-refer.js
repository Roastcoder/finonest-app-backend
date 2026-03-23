import db from './src/config/database.js';
import axios from 'axios';

async function debugReferCode() {
  try {
    const referCode = 'Y11EWE8B';
    console.log(`Checking refer code: ${referCode}\n`);
    
    // Check if this refer code exists
    const referCheck = await db.query(
      'SELECT id, user_id, name, full_name, role, refer_code FROM users WHERE refer_code = $1',
      [referCode]
    );
    
    console.log('Refer code search result:');
    if (referCheck.rows.length > 0) {
      referCheck.rows.forEach(user => {
        console.log(`  ✅ Found: ${user.user_id} - ${user.name || user.full_name} (${user.role})`);
      });
    } else {
      console.log('  ❌ Refer code not found');
    }
    
    // Check what roles can be referrers
    const validReferrers = await db.query(
      `SELECT id, user_id, name, full_name, role, refer_code 
       FROM users 
       WHERE role = ANY($1) AND refer_code IS NOT NULL`,
      [['branch_manager', 'dsa', 'sales_manager']]
    );
    
    console.log('\nValid referrers in database:');
    validReferrers.rows.forEach(user => {
      console.log(`  - ${user.refer_code}: ${user.name || user.full_name} (${user.role})`);
    });
    
    // Test signup with a valid refer code
    if (validReferrers.rows.length > 0) {
      const validReferCode = validReferrers.rows[0].refer_code;
      console.log(`\nTesting signup with valid refer code: ${validReferCode}`);
      
      const baseUrl = 'http://localhost:5000/api';
      const signupData = {
        name: 'Test Executive',
        email: `testexec${Date.now()}@example.com`,
        password: 'password123',
        phone: '9876543210',
        role: 'executive',
        refer_code: validReferCode
      };
      
      try {
        const response = await axios.post(`${baseUrl}/auth/signup`, signupData);
        console.log('✅ Signup successful with valid refer code');
        console.log('Status:', response.data.user.status);
        console.log('Approved via refer:', response.data.approved_via_refer);
      } catch (error) {
        console.log('❌ Signup failed even with valid refer code:');
        console.log('Error:', error.response?.data);
      }
    }
    
    // Test with the original refer code
    console.log(`\nTesting signup with original refer code: ${referCode}`);
    const baseUrl = 'http://localhost:5000/api';
    const signupData = {
      name: 'Test User Original',
      email: `testorig${Date.now()}@example.com`,
      password: 'password123',
      phone: '9876543210',
      role: 'executive',
      refer_code: referCode
    };
    
    try {
      const response = await axios.post(`${baseUrl}/auth/signup`, signupData);
      console.log('✅ Signup successful with original refer code');
    } catch (error) {
      console.log('❌ Signup failed with original refer code:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugReferCode();