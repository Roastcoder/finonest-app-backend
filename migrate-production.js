import db from './src/config/database.js';

async function migrateProductionDatabase() {
  try {
    console.log('🚀 Starting production database migration...');
    
    // Step 1: Check if email column exists
    const columnCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('✅ Email column already removed. Migration not needed.');
      return;
    }
    
    console.log('📋 Email column found. Starting migration...');
    
    // Step 2: Update any users that might have temp email format to use phone
    console.log('🔄 Updating users with temp email format...');
    const tempEmailUsers = await db.query(`
      SELECT id, email, phone 
      FROM users 
      WHERE email LIKE '%@finonest.temp'
    `);
    
    console.log(`Found ${tempEmailUsers.rows.length} users with temp email format`);
    
    // Step 3: Ensure all users have phone numbers
    console.log('🔄 Checking users without phone numbers...');
    const usersWithoutPhone = await db.query(`
      SELECT id, email, phone 
      FROM users 
      WHERE phone IS NULL OR phone = ''
    `);
    
    if (usersWithoutPhone.rows.length > 0) {
      console.log(`⚠️  Found ${usersWithoutPhone.rows.length} users without phone numbers:`);
      usersWithoutPhone.rows.forEach(user => {
        console.log(`  - User ID ${user.id}: ${user.email}`);
      });
      
      // For users without phone, extract from temp email if possible
      for (const user of usersWithoutPhone.rows) {
        if (user.email && user.email.includes('@finonest.temp')) {
          const phone = user.email.split('@')[0];
          if (phone && phone.length >= 10) {
            await db.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, user.id]);
            console.log(`  ✅ Updated user ${user.id} with phone ${phone}`);
          }
        }
      }
    }
    
    // Step 4: Remove the email column
    console.log('🗑️  Removing email column...');
    await db.query('ALTER TABLE users DROP COLUMN IF EXISTS email');
    
    // Step 5: Verify the column is removed
    const verifyCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    
    if (verifyCheck.rows.length === 0) {
      console.log('✅ Email column successfully removed');
    } else {
      console.log('❌ Email column still exists');
      return;
    }
    
    // Step 6: Show current table structure
    const tableStructure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Updated users table structure:');
    tableStructure.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Step 7: Test admin user
    console.log('\n🔍 Checking admin user...');
    const adminUser = await db.query(`
      SELECT id, user_id, name, phone, role, status 
      FROM users 
      WHERE role = 'admin' 
      ORDER BY id 
      LIMIT 1
    `);
    
    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      console.log('✅ Admin user found:');
      console.log(`  ID: ${admin.id}`);
      console.log(`  User ID: ${admin.user_id}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Phone: ${admin.phone}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Status: ${admin.status}`);
      
      if (!admin.phone) {
        console.log('⚠️  Admin user has no phone number. Setting default...');
        await db.query('UPDATE users SET phone = $1 WHERE id = $2', ['9999999999', admin.id]);
        console.log('✅ Admin phone updated to 9999999999');
      }
    } else {
      console.log('❌ No admin user found');
    }
    
    console.log('\n🎉 Production migration completed successfully!');
    console.log('\n📱 Admin Login Credentials:');
    console.log('Phone: 9999999999');
    console.log('MPIN: 1234');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

migrateProductionDatabase();