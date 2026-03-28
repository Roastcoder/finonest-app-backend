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

async function checkAllCharts() {
  try {
    console.log('\n=== ALL CHARTS DATA ===\n');

    // 1. Login Volume - Bank wise
    console.log('1️⃣  LOGIN VOLUME CHART (Bar Chart - Bank Wise):');
    const loginVolumeQuery = await pool.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", COUNT(l.id) as count
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED')
      GROUP BY 1
      ORDER BY 2 DESC
    `);
    console.log(JSON.stringify(loginVolumeQuery.rows, null, 2));

    // 2. Disbursement - Bank wise
    console.log('\n2️⃣  DISBURSEMENT CHART (Bar Chart - Bank Wise):');
    const disbursementQuery = await pool.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", 
             SUM(COALESCE(l.loan_amount, 0)) as amount, 
             COUNT(l.id) as units
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage = 'DISBURSED'
      GROUP BY 1
      ORDER BY 2 DESC
    `);
    console.log(JSON.stringify(disbursementQuery.rows, null, 2));

    // 3. Performance Trend - Monthly
    console.log('\n3️⃣  PERFORMANCE TREND CHART (Area Chart - Monthly):');
    const performanceTrendQuery = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
        COUNT(CASE WHEN application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED') THEN 1 END) as logins,
        COUNT(CASE WHEN application_stage = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN application_stage = 'DISBURSED' THEN 1 END) as disbursed
      FROM loans
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `);
    console.log(JSON.stringify(performanceTrendQuery.rows, null, 2));

    console.log('\n=== SUMMARY ===\n');
    console.log('📊 Login Volume:');
    console.log('   Banks: ' + loginVolumeQuery.rows.length);
    console.log('   Total Logins: ' + loginVolumeQuery.rows.reduce((sum, row) => sum + parseInt(row.count), 0));

    console.log('\n💰 Disbursement:');
    console.log('   Banks: ' + disbursementQuery.rows.length);
    console.log('   Total Amount: ₹' + disbursementQuery.rows.reduce((sum, row) => sum + parseInt(row.amount || 0), 0));
    console.log('   Total Units: ' + disbursementQuery.rows.reduce((sum, row) => sum + parseInt(row.units || 0), 0));

    console.log('\n📈 Performance Trend:');
    console.log('   Months: ' + performanceTrendQuery.rows.length);
    console.log('   Total Logins: ' + performanceTrendQuery.rows.reduce((sum, row) => sum + parseInt(row.logins), 0));
    console.log('   Total Approved: ' + performanceTrendQuery.rows.reduce((sum, row) => sum + parseInt(row.approved), 0));
    console.log('   Total Disbursed: ' + performanceTrendQuery.rows.reduce((sum, row) => sum + parseInt(row.disbursed), 0));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAllCharts();
