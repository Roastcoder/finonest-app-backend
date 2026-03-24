import db from './src/config/database.js';

async function debugAdminUser() {
  try {
    console.log('Debugging admin user in database...');
    
    // Check all users with admin role
    const adminUsers = await db.query(`
      SELECT id, user_id, name, full_name, email, phone, role, status, password
      FROM users 
      WHERE role = 'admin'
      ORDER BY id
    `);
    
    console.log('Admin users found:', adminUsers.rows.length);
    
    adminUsers.rows.forEach((user, index) => {
      console.log(`\nAdmin User ${index + 1}:`);
      console.log('  ID:', user.id);
      console.log('  User ID:', user.user_id);
      console.log('  Name:', user.name);
      console.log('  Full Name:', user.full_name);
      console.log('  Email:', user.email);
      console.log('  Phone:', user.phone);
      console.log('  Role:', user.role);
      console.log('  Status:', user.status);
      console.log('  Password Hash:', user.password ? 'Present' : 'Missing');
    });
    
    // Check if there's a user with the temp email
    const tempEmailUser = await db.query(`
      SELECT id, user_id, name, full_name, email, phone, role, status
      FROM users 
      WHERE email = '9999999999@finonest.temp'
    `);
    
    console.log('\nUser with temp email (9999999999@finonest.temp):', tempEmailUser.rows.length);
    if (tempEmailUser.rows.length > 0) {
      console.log('  Found:', tempEmailUser.rows[0]);
    }
    
    // Check if there's a user with phone 9999999999
    const phoneUser = await db.query(`
      SELECT id, user_id, name, full_name, email, phone, role, status
      FROM users 
      WHERE phone = '9999999999'
    `);
    
    console.log('\nUser with phone 9999999999:', phoneUser.rows.length);
    if (phoneUser.rows.length > 0) {
      console.log('  Found:', phoneUser.rows[0]);
    }
    
  } catch (error) {
    console.error('Error debugging admin user:', error);
  } finally {
    process.exit(0);
  }
}

debugAdminUser();