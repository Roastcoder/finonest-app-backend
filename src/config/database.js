import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Force TCP connection using connectionString
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  // Additional connection options to prevent local socket connection
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection details:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
  } else {
    console.log('✅ Database connected successfully to:', process.env.DB_HOST);
    release();
  }
});

export default pool;
