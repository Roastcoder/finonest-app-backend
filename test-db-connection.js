import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

console.log('🔍 Environment Variables Check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Present' : 'Missing');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n🔄 Testing database connection...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📅 Current time:', result.rows[0].current_time);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    
    // Try with individual parameters
    console.log('\n🔄 Trying with individual parameters...');
    const client2 = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    try {
      await client2.connect();
      console.log('✅ Individual parameters connection successful!');
      await client2.end();
    } catch (error2) {
      console.error('❌ Individual parameters also failed:', error2.message);
    }
  }
}

testConnection();