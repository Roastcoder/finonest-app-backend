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

async function checkConvertedLeads() {
  const client = await pool.connect();
  try {
    console.log('📊 Checking converted_to_loan column status...\n');
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name = 'converted_to_loan'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Column "converted_to_loan" does NOT exist in leads table!');
      console.log('   Run: node run-converted-to-loan-migration.js');
      return;
    }
    
    console.log('✅ Column "converted_to_loan" exists');
    console.log(`   Type: ${columnCheck.rows[0].data_type}`);
    console.log(`   Default: ${columnCheck.rows[0].column_default}\n`);
    
    // Check all leads
    const allLeads = await client.query(`
      SELECT id, customer_id, customer_name, 
             COALESCE(converted_to_loan, false) as converted_to_loan,
             application_stage,
             loan_created_at
      FROM leads 
      ORDER BY id
    `);
    
    console.log(`📋 Total Leads: ${allLeads.rows.length}\n`);
    
    allLeads.rows.forEach(lead => {
      const status = lead.converted_to_loan ? '🔄 CONVERTED' : '📝 ACTIVE';
      console.log(`${status} | ID: ${lead.id} | ${lead.customer_name} (${lead.customer_id})`);
      console.log(`         Stage: ${lead.application_stage} | Converted: ${lead.converted_to_loan}`);
      if (lead.loan_created_at) {
        console.log(`         Loan Created: ${lead.loan_created_at}`);
      }
      console.log('');
    });
    
    // Check loans table
    const loans = await client.query(`
      SELECT id, loan_number, customer_name, lead_id
      FROM loans 
      ORDER BY id
    `);
    
    console.log(`💰 Total Loans: ${loans.rows.length}\n`);
    
    if (loans.rows.length > 0) {
      loans.rows.forEach(loan => {
        console.log(`💰 Loan: ${loan.loan_number} | ${loan.customer_name} | Lead ID: ${loan.lead_id || 'N/A'}`);
      });
      console.log('');
    }
    
    // Check for mismatches
    const mismatch = await client.query(`
      SELECT l.id, l.customer_name, l.converted_to_loan, ln.id as loan_id
      FROM leads l
      LEFT JOIN loans ln ON l.id = ln.lead_id
      WHERE (l.converted_to_loan = true AND ln.id IS NULL)
         OR (l.converted_to_loan = false AND ln.id IS NOT NULL)
    `);
    
    if (mismatch.rows.length > 0) {
      console.log('⚠️  MISMATCHES FOUND:\n');
      mismatch.rows.forEach(m => {
        console.log(`   Lead ${m.id} (${m.customer_name}): converted_to_loan=${m.converted_to_loan}, has_loan=${m.loan_id ? 'YES' : 'NO'}`);
      });
    } else {
      console.log('✅ No mismatches found - all data is consistent!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkConvertedLeads();
