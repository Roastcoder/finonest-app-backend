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

async function checkLastLoan() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking last created loan...\n');
    
    // Get last loan
    const lastLoan = await client.query(`
      SELECT l.id, l.loan_number, l.customer_name, l.lead_id, l.created_at
      FROM loans l
      ORDER BY l.created_at DESC 
      LIMIT 1
    `);
    
    if (lastLoan.rows.length === 0) {
      console.log('No loans found');
      return;
    }
    
    const loan = lastLoan.rows[0];
    console.log('📋 Last Loan Created:');
    console.log(`   Loan Number: ${loan.loan_number}`);
    console.log(`   Customer: ${loan.customer_name}`);
    console.log(`   Lead ID: ${loan.lead_id || 'NULL ❌'}`);
    console.log(`   Created At: ${loan.created_at}`);
    
    if (loan.lead_id) {
      console.log('\n🔗 Checking associated lead...\n');
      const lead = await client.query(`
        SELECT id, customer_id, customer_name, converted_to_loan, loan_created_at
        FROM leads 
        WHERE id = $1
      `, [loan.lead_id]);
      
      if (lead.rows.length > 0) {
        const l = lead.rows[0];
        console.log('📝 Associated Lead:');
        console.log(`   Lead ID: ${l.id}`);
        console.log(`   Customer ID: ${l.customer_id}`);
        console.log(`   Customer Name: ${l.customer_name}`);
        console.log(`   Converted to Loan: ${l.converted_to_loan ? '✅ TRUE' : '❌ FALSE'}`);
        console.log(`   Loan Created At: ${l.loan_created_at || 'NULL'}`);
        
        if (!l.converted_to_loan) {
          console.log('\n⚠️  ISSUE: Lead is NOT marked as converted!');
          console.log('   Fixing now...');
          
          await client.query(`
            UPDATE leads 
            SET converted_to_loan = true, loan_created_at = NOW() 
            WHERE id = $1
          `, [loan.lead_id]);
          
          console.log('   ✅ Lead marked as converted');
        }
      }
    } else {
      console.log('\n❌ ISSUE: Loan has no lead_id!');
      console.log('   This means lead_id was not passed from frontend to backend.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkLastLoan();
