import db from './src/config/database.js';

async function fixDuplicatePhone() {
  try {
    console.log('Fixing duplicate phone number issue...');
    
    // Update the DSA user to have a different phone number
    const result = await db.query(`
      UPDATE users 
      SET phone = '9999999998', email = '9999999998@finonest.temp'
      WHERE id = 20 AND role = 'dsa'
      RETURNING id, user_id, name, email, phone, role
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ DSA user updated:');
      console.log('  ID:', result.rows[0].id);
      console.log('  Name:', result.rows[0].name);
      console.log('  Email:', result.rows[0].email);
      console.log('  Phone:', result.rows[0].phone);
      console.log('  Role:', result.rows[0].role);
    }
    
    // Verify admin user is now unique with phone 9999999999
    const adminCheck = await db.query(`
      SELECT id, user_id, name, email, phone, role, status
      FROM users 
      WHERE phone = '9999999999'
    `);
    
    console.log('\\nUsers with phone 9999999999 after fix:', adminCheck.rows.length);
    if (adminCheck.rows.length === 1) {
      console.log('✅ Admin user is now unique:');
      console.log('  ID:', adminCheck.rows[0].id);
      console.log('  Name:', adminCheck.rows[0].name);
      console.log('  Email:', adminCheck.rows[0].email);
      console.log('  Phone:', adminCheck.rows[0].phone);
      console.log('  Role:', adminCheck.rows[0].role);
      console.log('  Status:', adminCheck.rows[0].status);
    }
    
    console.log('\\n✅ Admin login should now work with:');
    console.log('Phone: 9999999999');
    console.log('MPIN: 1234');
    
  } catch (error) {
    console.error('Error fixing duplicate phone:', error);
  } finally {
    process.exit(0);
  }
}

fixDuplicatePhone();