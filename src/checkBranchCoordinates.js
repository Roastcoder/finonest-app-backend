import db from './config/database.js';

const checkCoordinates = async () => {
  try {
    console.log('🔍 Checking branch coordinates in database...\n');

    const result = await db.query(`
      SELECT 
        id,
        branch_name,
        location,
        latitude,
        longitude,
        CASE 
          WHEN latitude IS NULL OR longitude IS NULL THEN 'MISSING'
          WHEN latitude = 0 OR longitude = 0 THEN 'ZERO VALUES'
          ELSE 'VALID'
        END as coord_status
      FROM bank_branches
      LIMIT 20
    `);

    const branches = result.rows;
    console.log(`Total branches checked: ${branches.length}\n`);

    branches.forEach((branch, idx) => {
      console.log(`${idx + 1}. ${branch.branch_name}`);
      console.log(`   Location: ${branch.location}`);
      console.log(`   Latitude: ${branch.latitude}`);
      console.log(`   Longitude: ${branch.longitude}`);
      console.log(`   Status: ${branch.coord_status}`);
      console.log('');
    });

    // Summary
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coords,
        COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as without_coords,
        COUNT(CASE WHEN latitude = 0 OR longitude = 0 THEN 1 END) as zero_values
      FROM bank_branches
    `);

    const stats = summary.rows[0];
    console.log('========================================');
    console.log('📊 Summary:');
    console.log(`   Total branches: ${stats.total}`);
    console.log(`   With coordinates: ${stats.with_coords}`);
    console.log(`   Without coordinates: ${stats.without_coords}`);
    console.log(`   Zero values: ${stats.zero_values}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkCoordinates();
