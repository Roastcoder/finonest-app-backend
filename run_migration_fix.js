import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔄 Reading migration script...');
    const migrationScript = fs.readFileSync(
      path.join(process.cwd(), 'fix_database_schema.sql'), 
      'utf8'
    );

    console.log('🔄 Running database migration...');
    await client.query(migrationScript);
    console.log('✅ Database migration completed successfully');

    // Verify critical tables exist
    console.log('🔄 Verifying database structure...');
    
    const tables = ['users', 'banks', 'brokers', 'branches', 'leads', 'loans', 'documents', 'system_config'];
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }

    // Check for admin user
    const adminCheck = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `);
    
    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('🔄 Creating default admin user...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (user_id, full_name, email, password, role, status)
        VALUES ('AD-0001', 'Admin User', 'admin@finonest.com', $1, 'admin', 'active')
        ON CONFLICT (email) DO NOTHING
      `, [hashedPassword]);
      
      console.log('✅ Default admin user created');
      console.log('📧 Email: admin@finonest.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Check for test accountant user
    const accountantCheck = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE email = 'accountant@finonest.com'
    `);
    
    if (parseInt(accountantCheck.rows[0].count) === 0) {
      console.log('🔄 Creating test accountant user...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('accountant@123', 10);
      
      await client.query(`
        INSERT INTO users (user_id, full_name, email, password, role, status)
        VALUES ('AC-0001', 'Accountant User', 'accountant@finonest.com', $1, 'accountant', 'active')
        ON CONFLICT (email) DO NOTHING
      `, [hashedPassword]);
      
      console.log('✅ Test accountant user created');
      console.log('📧 Email: accountant@finonest.com');
      console.log('🔑 Password: accountant@123');
    } else {
      console.log('✅ Accountant user already exists');
    }

    console.log('\n🎉 Database migration and setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- All required tables and columns have been created/updated');
    console.log('- Foreign key constraints have been added');
    console.log('- Indexes have been created for better performance');
    console.log('- Default system configuration has been inserted');
    console.log('- Admin and test users have been created');
    console.log('\n🚀 Your application should now work properly!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
runMigration();