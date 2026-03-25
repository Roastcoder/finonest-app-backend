import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

async function setupDSA() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking for DSA users...\n');
    
    // Check existing DSA users
    const existingDSA = await client.query(`
      SELECT id, user_id, full_name, email, role, created_at
      FROM users 
      WHERE role = 'dsa'
      ORDER BY created_at DESC
    `);
    
    if (existingDSA.rows.length > 0) {
      console.log('✅ Found existing DSA users:\n');
      existingDSA.rows.forEach((dsa, index) => {
        console.log(`${index + 1}. ${dsa.full_name} (${dsa.user_id})`);
        console.log(`   Email: ${dsa.email}`);
        console.log(`   Created: ${dsa.created_at}`);
        console.log('');
      });
      
      console.log('📝 Note: Passwords are hashed. Use password reset if needed.\n');
    } else {
      console.log('❌ No DSA users found. Creating default DSA user...\n');
      
      // Create default DSA user
      const password = 'dsa123456';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate user_id
      const seqResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM '\\d+$') AS INTEGER)), 0) + 1 as next_seq
        FROM users
      `);
      const sequence = String(seqResult.rows[0].next_seq).padStart(4, '0');
      const userId = `DS-${sequence}`;
      
      const result = await client.query(`
        INSERT INTO users (
          user_id, name, full_name, email, password, role, 
          phone, status, joining_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, full_name, email
      `, [
        userId,
        'DSA Partner',
        'DSA Partner',
        'dsa@finonest.com',
        hashedPassword,
        'dsa',
        '9999999999',
        'active',
        new Date().toISOString().split('T')[0]
      ]);
      
      console.log('✅ DSA User Created Successfully!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:    dsa@finonest.com');
      console.log('🔑 Password: dsa123456');
      console.log('👤 User ID:  ' + result.rows[0].user_id);
      console.log('👤 Name:     ' + result.rows[0].full_name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDSA();
