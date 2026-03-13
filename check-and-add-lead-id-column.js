import pg from 'pg';
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

async function checkLeadIdColumn() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking loans table structure...\n');
    
    // Check if lead_id column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name = 'lead_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Column "lead_id" does NOT exist in loans table!');
      console.log('\n📝 Adding lead_id column...\n');
      
      // Add lead_id column
      await client.query(`
        ALTER TABLE loans 
        ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id)
      `);
      
      console.log('✅ Column "lead_id" added successfully!');
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_loans_lead_id ON loans(lead_id)
      `);
      
      console.log('✅ Index created on lead_id column');
    } else {
      console.log('✅ Column "lead_id" already exists');
      console.log(`   Type: ${columnCheck.rows[0].data_type}`);
      console.log(`   Nullable: ${columnCheck.rows[0].is_nullable}`);
    }
    
    // Check recent loans
    console.log('\n📋 Recent loans with lead_id:\n');
    const recentLoans = await client.query(`
      SELECT id, loan_number, customer_name, lead_id
      FROM loans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    recentLoans.rows.forEach(loan => {
      console.log(`  Loan: ${loan.loan_number} | ${loan.customer_name} | Lead ID: ${loan.lead_id || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkLeadIdColumn();
