import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use connection string if provided (helps with remote DBs), otherwise use individual parameters
const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

// Use SSL only if explicitly requested or if in production AND not explicitly disabled
const useSSL = process.env.DB_SSL === 'true' || (isProduction && process.env.DB_SSL !== 'false');

const poolConfig = connectionString 
  ? { 
      connectionString, 
      ssl: useSSL ? { rejectUnauthorized: false } : false 
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'car_credit_hub',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'your_password',
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
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
    console.log('✅ Database connected successfully');
    console.log('✅ Connected to:', `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    release();
  }
});

export default pool;
