import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

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

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add_converted_to_loan_column.sql');
    
    const sql = fs.readFileSync('./add_converted_to_loan_column.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify columns exist
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name IN ('converted_to_loan', 'loan_created_at')
      ORDER BY column_name
    `);
    
    console.log('\nVerification:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
