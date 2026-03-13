import db from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function createManagers() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Get admin user
    const admin = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const adminId = admin.rows[0]?.id;
    
    if (!adminId) {
      console.error('❌ No admin user found');
      return;
    }
    
    // Get a branch
    const branch = await db.query('SELECT id FROM branches LIMIT 1');
    const branchId = branch.rows[0]?.id || 1;
    
    // Create Sales Manager
    const sm = await db.query(
      `INSERT INTO users (user_id, full_name, name, email, password, phone, role, reporting_to, joining_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()::date, $9) 
       RETURNING id, user_id, full_name, role`,
      ['SM-0001', 'Rajesh Kumar', 'Rajesh Kumar', 'rajesh@company.com', hashedPassword, '9876543210', 'sales_manager', adminId, 'active']
    );
    console.log('✅ Sales Manager Created:', sm.rows[0]);
    
    // Create Branch Manager
    const bm = await db.query(
      `INSERT INTO users (user_id, full_name, name, email, password, phone, role, reporting_to, branch_id, joining_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()::date, $10) 
       RETURNING id, user_id, full_name, role, branch_id`,
      ['BM-0001', 'Priya Singh', 'Priya Singh', 'priya@company.com', hashedPassword, '9876543211', 'branch_manager', sm.rows[0].id, branchId, 'active']
    );
    console.log('✅ Branch Manager Created:', bm.rows[0]);
    
    console.log('\n✅ Both users created successfully!');
    console.log('Sales Manager - Email: rajesh@company.com, Password: password123');
    console.log('Branch Manager - Email: priya@company.com, Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createManagers();
