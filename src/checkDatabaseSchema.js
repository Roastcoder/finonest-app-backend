import db from './config/database.js';

const checkSchema = async () => {
  try {
    console.log('🔍 Checking bank_branches table schema...\n');

    const result = await db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'bank_branches'
      ORDER BY ordinal_position
    `);

    console.log('Columns in bank_branches table:\n');
    result.rows.forEach(col => {
      console.log(`${col.column_name}`);
      console.log(`  Type: ${col.data_type}`);
      console.log(`  Nullable: ${col.is_nullable}`);
      console.log(`  Default: ${col.column_default || 'None'}`);
      console.log('');
    });

    // Check latitude and longitude specifically
    console.log('========================================');
    console.log('Latitude & Longitude Details:\n');
    
    const latLngResult = await db.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'bank_branches'
      AND column_name IN ('latitude', 'longitude')
    `);

    latLngResult.rows.forEach(col => {
      console.log(`${col.column_name}:`);
      console.log(`  Data Type: ${col.data_type}`);
      console.log(`  Precision: ${col.numeric_precision}`);
      console.log(`  Scale: ${col.numeric_scale}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkSchema();
