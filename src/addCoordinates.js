import pool from './config/database.js';

const addCoordinates = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Adding latitude and longitude columns to bank_branches...');

    await client.query(`
      ALTER TABLE bank_branches 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
    `);

    await client.query(`
      ALTER TABLE bank_branches 
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
    `);

    console.log('✅ Columns added successfully!');
    console.log('📍 You can now add coordinates to branches');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

addCoordinates();
