import bcrypt from 'bcryptjs';
import db from './src/config/database.js';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    // Check if admin user exists
    const result = await db.query(`
      SELECT id, email, phone, password, role, status
      FROM users 
      WHERE email = '9999999999@finonest.temp'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Admin user found:');
    console.log('  Email:', user.email);
    console.log('  Phone:', user.phone);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
    
    // Test password
    const isPasswordValid = await bcrypt.compare('1234', user.password);
    console.log('  Password valid:', isPasswordValid ? '✅' : '❌');
    
    if (!isPasswordValid) {
      console.log('❌ Password does not match. Updating password...');
      const hashedPassword = await bcrypt.hash('1234', 10);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
      console.log('✅ Password updated');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    process.exit(0);
  }
}

testAdminLogin();