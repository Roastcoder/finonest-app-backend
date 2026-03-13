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
    console.log('🔄 Running bank fields migration...\n');
    
    const sql = fs.readFileSync('./add_bank_fields.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify columns
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'banks' 
      AND column_name IN (
        'location', 'geo_limit', 'sales_manager_name', 'sales_manager_mobile',
        'area_sales_manager_name', 'area_sales_manager_mobile', 'product', 'logo_url'
      )
      ORDER BY column_name
    `);
    
    console.log('📋 New columns added:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}: ${row.data_type}`);
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
