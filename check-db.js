import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'car_credit_hub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
});

async function checkDatabase() {
  try {
    console.log('\n=== DATABASE STATS ===\n');

    // Check loans
    const loansResult = await pool.query('SELECT COUNT(*) as count FROM loans');
    const loansCount = loansResult.rows[0]?.count || 0;
    console.log('✅ Total Loans:', loansCount);

    // Check leads
    const leadsResult = await pool.query('SELECT COUNT(*) as count FROM leads');
    const leadsCount = leadsResult.rows[0]?.count || 0;
    console.log('✅ Total Leads:', leadsCount);

    // Check loan stages breakdown
    console.log('\n📊 Loans by Stage:');
    const stagesResult = await pool.query('SELECT application_stage, COUNT(*) as count FROM loans GROUP BY application_stage ORDER BY count DESC');
    stagesResult.rows.forEach(row => {
      console.log(`   ${row.application_stage}: ${row.count}`);
    });

    // Check leads status breakdown
    console.log('\n📊 Leads by Status:');
    const leadsStatusResult = await pool.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status ORDER BY count DESC');
    leadsStatusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    // Check monthly trend
    console.log('\n📈 Monthly Trend (Last 12 months):');
    const monthlyResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(CASE WHEN application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED') THEN 1 END) as logins,
        COUNT(CASE WHEN application_stage = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN application_stage = 'DISBURSED' THEN 1 END) as disbursed
      FROM loans
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `);
    
    if (monthlyResult.rows.length > 0) {
      monthlyResult.rows.forEach(row => {
        console.log(`   ${row.month}: Logins=${row.logins}, Approved=${row.approved}, Disbursed=${row.disbursed}`);
      });
    } else {
      console.log('   No data found');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkDatabase();
