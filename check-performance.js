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

async function checkPerformanceData() {
  try {
    console.log('\n=== PERFORMANCE TREND DATA ===\n');

    // Get monthly trend exactly as backend does
    const monthlyTrendQuery = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
        EXTRACT(MONTH FROM created_at) as month_num,
        COUNT(CASE WHEN application_stage IN ('LOGIN', 'IN_PROCESS', 'APPROVED', 'DISBURSED') THEN 1 END) as logins,
        COUNT(CASE WHEN application_stage = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN application_stage = 'DISBURSED' THEN 1 END) as disbursed
      FROM loans
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at), EXTRACT(MONTH FROM created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `);

    console.log('Backend Query Result:');
    console.log(JSON.stringify(monthlyTrendQuery.rows, null, 2));

    if (monthlyTrendQuery.rows.length === 0) {
      console.log('\n⚠️  No data found! Backend will use FALLBACK mock data');
      console.log('\nFallback Mock Data (What will show):');
      const mockData = [
        { month: 'Jan', logins: 45, approved: 12, disbursed: 8 },
        { month: 'Feb', logins: 52, approved: 15, disbursed: 10 },
        { month: 'Mar', logins: 48, approved: 14, disbursed: 9 },
        { month: 'Apr', logins: 61, approved: 18, disbursed: 12 },
        { month: 'May', logins: 55, approved: 16, disbursed: 11 },
        { month: 'Jun', logins: 67, approved: 20, disbursed: 14 },
        { month: 'Jul', logins: 72, approved: 22, disbursed: 16 },
        { month: 'Aug', logins: 68, approved: 21, disbursed: 15 },
        { month: 'Sep', logins: 74, approved: 23, disbursed: 17 },
        { month: 'Oct', logins: 81, approved: 25, disbursed: 19 },
        { month: 'Nov', logins: 78, approved: 24, disbursed: 18 },
        { month: 'Dec', logins: 85, approved: 28, disbursed: 22 },
      ];
      console.log(JSON.stringify(mockData, null, 2));
    } else {
      console.log('\n✅ Real data found! This will show in chart');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkPerformanceData();
