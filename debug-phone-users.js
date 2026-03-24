import bcrypt from 'bcryptjs';
import db from './src/config/database.js';

async function debugPhoneUsers() {
  try {
    console.log('Checking all users with phone 9999999999...');
    
    const phoneUsers = await db.query(`
      SELECT id, user_id, name, full_name, email, phone, role, status, password
      FROM users 
      WHERE phone = '9999999999'
      ORDER BY id
    `);
    
    console.log('Users with phone 9999999999:', phoneUsers.rows.length);
    
    for (let i = 0; i < phoneUsers.rows.length; i++) {
      const user = phoneUsers.rows[i];
      console.log(`\nUser ${i + 1}:`);
      console.log('  ID:', user.id);
      console.log('  User ID:', user.user_id);
      console.log('  Name:', user.name);
      console.log('  Full Name:', user.full_name);
      console.log('  Email:', user.email);
      console.log('  Phone:', user.phone);
      console.log('  Role:', user.role);
      console.log('  Status:', user.status);
      
      // Test password
      if (user.password) {
        const isValid = await bcrypt.compare('1234', user.password);
        console.log('  Password "1234" valid:', isValid ? '✅' : '❌');
      } else {
        console.log('  Password: Missing');
      }
    }
    
    // Test the exact login query
    console.log('\n--- Testing Login Query ---');
    const loginResult = await db.query(`
      SELECT u.*, m.name as manager_name, m.full_name as manager_full_name, m.role as manager_role
      FROM users u
      LEFT JOIN users m ON u.reporting_to = m.id
      WHERE u.phone = $1
    `, ['9999999999']);
    
    console.log('Login query result count:', loginResult.rows.length);
    if (loginResult.rows.length > 0) {
      const user = loginResult.rows[0];
      console.log('First result:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Phone:', user.phone);
      console.log('  Role:', user.role);
      console.log('  Status:', user.status);
      
      if (user.password) {
        const isValid = await bcrypt.compare('1234', user.password);
        console.log('  Password "1234" valid:', isValid ? '✅' : '❌');
      }
    }
    
  } catch (error) {
    console.error('Error debugging phone users:', error);
  } finally {
    process.exit(0);
  }
}

debugPhoneUsers();