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

async function compareCharts() {
  try {
    console.log('\n=== LOGIN VOLUME CHART DATA ===\n');

    // Login Volume - Bank wise
    const loginVolumeQuery = await pool.query(`
      SELECT COALESCE(b.name, l.financier_name, 'Unassigned') as "bankName", COUNT(l.id) as count
      FROM loans l
      LEFT JOIN banks b ON l.bank_id = b.id
      WHERE l.application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED')
      GROUP BY 1
      ORDER BY 2 DESC
    `);

    console.log('Login Volume (Bank Wise):');
    console.log(JSON.stringify(loginVolumeQuery.rows, null, 2));

    console.log('\n=== PERFORMANCE TREND CHART DATA ===\n');

    // Performance Trend - Monthly
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

    console.log('Performance Trend (Monthly):');
    console.log(JSON.stringify(performanceTrendQuery.rows, null, 2));

    console.log('\n=== COMPARISON ===\n');
    console.log('Login Volume Chart:');
    console.log('  - Shows: Bank wise logins (Bar chart)');
    console.log('  - Data: ' + loginVolumeQuery.rows.length + ' banks');
    console.log('  - Total logins: ' + loginVolumeQuery.rows.reduce((sum, row) => sum + parseInt(row.count), 0));

    console.log('\nPerformance Trend Chart:');
    console.log('  - Shows: Monthly trend (Area chart)');
    console.log('  - Data: ' + performanceTrendQuery.rows.length + ' months');
    console.log('  - Total logins: ' + performanceTrendQuery.rows.reduce((sum, row) => sum + parseInt(row.logins), 0));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

compareCharts();
