import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use individual connection parameters instead of DATABASE_URL
const pool = new Pool({
  host: process.env.DB_HOST || '72.61.238.231',
  port: parseInt(process.env.DB_PORT) || 3000,
  database: process.env.DB_NAME || 'board',
  user: process.env.DB_USER || 'Board',
  password: process.env.DB_PASSWORD || 'Sanam@28',
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
    console.error('❌ Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
  } else {
    console.log('✅ Database connected successfully via TCP connection');
    console.log('✅ Connected to:', `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    release();
  }
});

export default pool;
