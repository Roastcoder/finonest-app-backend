import db from './config/database.js';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: GOOGLE_MAPS_API_KEY,
        region: 'in'
      },
      timeout: 5000
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    return null;
  } catch (error) {
    console.error(`Error geocoding ${address}:`, error.message);
    return null;
  }
}

const populateCoordinates = async () => {
  try {
    console.log('🔄 Fetching branches without coordinates...\n');

    const result = await db.query(`
      SELECT id, branch_name, location 
      FROM bank_branches 
      WHERE (latitude IS NULL OR longitude IS NULL)
      AND location IS NOT NULL
      LIMIT 50
    `);

    const branches = result.rows;
    console.log(`Found ${branches.length} branches without coordinates\n`);

    if (branches.length === 0) {
      console.log('✅ All branches already have coordinates!');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const branch of branches) {
      console.log(`📍 Processing: ${branch.branch_name}`);
      console.log(`   Location: ${branch.location}`);

      const coords = await geocodeAddress(branch.location);

      if (coords) {
        await db.query(
          `UPDATE bank_branches SET latitude = $1, longitude = $2 WHERE id = $3`,
          [coords.lat, coords.lng, branch.id]
        );
        console.log(`   ✅ Saved: lat=${coords.lat}, lng=${coords.lng}\n`);
        successCount++;
      } else {
        console.log(`   ❌ Failed to geocode\n`);
        failCount++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n========================================');
    console.log(`✅ Completed!`);
    console.log(`   Successfully geocoded: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

populateCoordinates();
