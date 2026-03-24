import db from './src/config/database.js';

async function updateAdminEmail() {
  try {
    // Update admin user email to match phone-based temp email format
    const result = await db.query(`
      UPDATE users 
      SET email = '9999999999@finonest.temp'
      WHERE phone = '9999999999' AND role = 'admin'
      RETURNING id, email, phone, role, status
    `, []);
    
    if (result.rows.length > 0) {
      console.log('Admin email updated successfully:');
      console.log('Email:', result.rows[0].email);
      console.log('Phone:', result.rows[0].phone);
      console.log('Role:', result.rows[0].role);
      console.log('Status:', result.rows[0].status);
    } else {
      console.log('No admin user found with phone 9999999999');
    }
    
    console.log('\nAdmin login credentials:');
    console.log('Phone: 9999999999');
    console.log('MPIN: admin123');
    
  } catch (error) {
    console.error('Error updating admin email:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminEmail();