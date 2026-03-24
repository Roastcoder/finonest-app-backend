import bcrypt from 'bcryptjs';
import db from './src/config/database.js';

async function updateAdminUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update admin user with phone number
    const result = await db.query(`
      UPDATE users 
      SET phone = $1, password = $2, status = 'active'
      WHERE email = 'admin@finonest.com' OR role = 'admin'
      RETURNING id, email, phone, role, status
    `, ['9999999999', hashedPassword]);
    
    if (result.rows.length > 0) {
      console.log('Admin user updated successfully:');
      console.log('Phone:', result.rows[0].phone);
      console.log('Role:', result.rows[0].role);
      console.log('Status:', result.rows[0].status);
    } else {
      console.log('No admin user found. Creating new admin user...');
      
      // Create new admin user
      const createResult = await db.query(`
        INSERT INTO users (
          user_id, name, full_name, email, phone, password, role, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, email, phone, role, status
      `, [
        'FN00001', 
        'Admin', 
        'System Admin', 
        'admin@finonest.com', 
        '9999999999', 
        hashedPassword, 
        'admin', 
        'active',
        new Date(),
        new Date()
      ]);
      
      console.log('New admin user created:');
      console.log('Phone:', createResult.rows[0].phone);
      console.log('Role:', createResult.rows[0].role);
      console.log('Status:', createResult.rows[0].status);
    }
    
    console.log('\nAdmin login credentials:');
    console.log('Phone: 9999999999');
    console.log('MPIN: admin123');
    
  } catch (error) {
    console.error('Error updating admin user:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminUser();