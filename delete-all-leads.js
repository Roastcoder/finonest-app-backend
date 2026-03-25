import pool from './src/config/database.js';

async function deleteAllLeads() {
  try {
    const result = await pool.query('DELETE FROM leads');
    console.log(`✅ Deleted ${result.rowCount} leads`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

deleteAllLeads();