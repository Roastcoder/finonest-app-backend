import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Ensure we have the DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required');
  console.error('Current DATABASE_URL:', process.env.DATABASE_URL);
  process.exit(1);
}

// Force TCP connection by ONLY using connectionString
// Do NOT provide individual host/port/user parameters to prevent local socket connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('❌ Error code:', err.code);
    console.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
    // Don't exit the process, let it retry
  } else {
    console.log('✅ Database connected successfully via connection string');
    release();
  }
});

export default pool;
