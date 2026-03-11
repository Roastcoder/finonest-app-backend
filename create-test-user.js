import bcrypt from 'bcryptjs';
import db from './src/config/database.js';

async function createTestUser() {
  try {
    const email = 'test@finonest.com';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      // Update password
      await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      console.log('✓ Updated test user password');
    } else {
      // Create new user
      await db.query(`
        INSERT INTO users (user_id, name, full_name, email, password, role, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['TEST-0001', 'Test User', 'Test User', email, hashedPassword, 'admin', 'active']);
      console.log('✓ Created test user');
    }
    
    console.log('Test credentials:');
    console.log('Email: test@finonest.com');
    console.log('Password: test123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestUser();