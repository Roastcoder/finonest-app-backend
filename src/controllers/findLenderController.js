import db from '../config/database.js';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

async function geocodeAddress(address) {
  try {
    console.log(`\n🌐 [GOOGLE MAPS API] Starting geocode for: "${address}"`);
    console.log(`📍 [GOOGLE MAPS API] Endpoint: https://maps.googleapis.com/maps/api/geocode/json`);
    console.log(`📍 [GOOGLE MAPS API] Parameters: address="${address}", region="in"`);
    
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
      console.log(`✅ [GOOGLE MAPS API] Success! Got coordinates: lat=${location.lat}, lng=${location.lng}`);
      console.log(`✅ [GOOGLE MAPS API] Formatted Address: ${response.data.results[0].formatted_address}\n`);
      
      return {
        lat: location.lat,
        lng: location.lng,
        source: 'google-maps'
      };
    }

    console.log(`❌ [GOOGLE MAPS API] No results found for: "${address}"\n`);
    return null;
  } catch (error) {
    console.error(`❌ [GOOGLE MAPS API] Error: ${error.message}\n`);
    return null;
  }
}

async function getDistanceBetweenCoordinates(lat1, lng1, lat2, lng2) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${lat1},${lng1}`,
        destinations: `${lat2},${lng2}`,
        key: GOOGLE_MAPS_API_KEY,
        mode: 'driving',
        units: 'metric'
      },
      timeout: 10000
    });

    if (response.data.rows && response.data.rows.length > 0) {
      const element = response.data.rows[0].elements[0];
      if (element.status === 'OK' && element.distance) {
        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;
        return parseFloat(distanceInKm.toFixed(2));
      }
    }
    
    // Fallback to Haversine formula for straight-line distance
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return parseFloat(distance.toFixed(2));
  } catch (error) {
    console.error(`   ❌ [DISTANCE] Error: ${error.message}`);
    // Fallback to Haversine formula
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return parseFloat(distance.toFixed(2));
  }
}

// Batch distance calculation using Google Distance Matrix API
async function getBatchDistances(customerLat, customerLng, branches) {
  try {
    console.log(`\n   📍 [BATCH DISTANCE] Customer Location: lat=${customerLat}, lng=${customerLng}`);
    
    // Filter branches with valid coordinates
    const validBranches = branches.filter(b => b.latitude && b.longitude);
    
    if (validBranches.length === 0) {
      console.log(`   ⚠️  [BATCH DISTANCE] No branches with valid coordinates`);
      return [];
    }

    console.log(`   📊 [BATCH DISTANCE] Processing ${validBranches.length} branches with coordinates\n`);

    // Google Distance Matrix API supports up to 25 destinations per request
    const BATCH_SIZE = 25;
    const results = [];

    for (let i = 0; i < validBranches.length; i += BATCH_SIZE) {
      const batch = validBranches.slice(i, i + BATCH_SIZE);
      const destinations = batch.map(b => `${b.latitude},${b.longitude}`).join('|');

      console.log(`   📦 [BATCH ${Math.floor(i/BATCH_SIZE) + 1}] Processing ${batch.length} branches...`);
      console.log(`   🎯 [BATCH ${Math.floor(i/BATCH_SIZE) + 1}] Origin: ${customerLat},${customerLng}`);
      console.log(`   🎯 [BATCH ${Math.floor(i/BATCH_SIZE) + 1}] First destination: ${batch[0].latitude},${batch[0].longitude} (${batch[0].branch_name})`);

      try {
        const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
        const params = {
          origins: `${customerLat},${customerLng}`,
          destinations: destinations,
          key: GOOGLE_MAPS_API_KEY,
          mode: 'driving',
          units: 'metric',
          language: 'en'
        };

        console.log(`   🌐 [BATCH ${Math.floor(i/BATCH_SIZE) + 1}] Calling Google Distance Matrix API...`);
        
        const response = await axios.get(url, {
          params: params,
          timeout: 15000
        });

        console.log(`   ✅ [BATCH ${Math.floor(i/BATCH_SIZE) + 1}] API Response Status: ${response.data.status}`);

        if (response.data.status !== 'OK') {
          console.error(`   ❌ [BATCH ${Math.floor(i/BATCH_SIZE) + 1}] API Error: ${response.data.status} - ${response.data.error_message || 'No error message'}`);
          throw new Error(`Google API returned status: ${response.data.status}`);
        }

        if (response.data.rows && response.data.rows.length > 0) {
          const elements = response.data.rows[0].elements;
          
          batch.forEach((branch, idx) => {
            const element = elements[idx];
            let distance = null;

            if (element && element.status === 'OK' && element.distance) {
              const distanceInMeters = element.distance.value;
              distance = parseFloat((distanceInMeters / 1000).toFixed(2));
              console.log(`      ✅ ${branch.branch_name}: ${distance} km (${element.distance.text})`);
            } else {
              console.log(`      ⚠️  ${branch.branch_name}: API status = ${element?.status || 'UNKNOWN'}`);
              // Fallback to Haversine
              const R = 6371;
              const dLat = (branch.latitude - customerLat) * Math.PI / 180;
              const dLng = (branch.longitude - customerLng) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(customerLat * Math.PI / 180) * Math.cos(branch.latitude * Math.PI / 180) *
                        Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              distance = parseFloat((R * c).toFixed(2));
              console.log(`      🔄 ${branch.branch_name}: ${distance} km (straight-line fallback)`);
            }

            results.push({
              ...branch,
              distance: distance
            });
          });
        }
      } catch (batchError) {
        console.error(`   ❌ [BATCH ${Math.floor(i/BATCH_SIZE) + 1}] Error: ${batchError.message}`);
        // Fallback for entire batch
        batch.forEach(branch => {
          const R = 6371;
          const dLat = (branch.latitude - customerLat) * Math.PI / 180;
          const dLng = (branch.longitude - customerLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(customerLat * Math.PI / 180) * Math.cos(branch.latitude * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = parseFloat((R * c).toFixed(2));
          
          console.log(`      🔄 ${branch.branch_name}: ${distance} km (error fallback)`);
          
          results.push({
            ...branch,
            distance: distance
          });
        });
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < validBranches.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`\n   ✅ [BATCH DISTANCE] Completed processing all branches\n`);
    return results;
  } catch (error) {
    console.error(`❌ [BATCH DISTANCE] Fatal Error: ${error.message}`);
    return branches.map(branch => ({
      ...branch,
      distance: null
    }));
  }
}

function parseGeoLimit(geoLimit) {
  if (!geoLimit) return null;
  const match = String(geoLimit).match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

export const findLendersByAddress = async (req, res) => {
  try {
    console.log('\n\n========================================');
    console.log('🚀 [FIND LENDER] Starting Find Lender Process');
    console.log('========================================\n');
    
    const { address, case_type, radius = 50 } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    console.log(`📍 [FIND LENDER] User searching for: "${address}"`);
    console.log(`🎯 [FIND LENDER] Case Type: ${case_type || 'All'}`);
    console.log(`📏 [FIND LENDER] Logic: Show branches where customer is within their service area\n`);

    // Geocode customer address
    console.log(`🔍 [FIND LENDER] Step 1: Geocoding customer address...`);
    const customerCoords = await geocodeAddress(address);
    if (!customerCoords) {
      console.log(`❌ [FIND LENDER] Failed to geocode customer address\n`);
      return res.status(400).json({ error: 'Could not find your address. Please try another location.' });
    }

    console.log(`✅ [FIND LENDER] Customer coordinates obtained: lat=${customerCoords.lat}, lng=${customerCoords.lng}\n`);

    // Get all active branches from DB
    console.log(`🔍 [FIND LENDER] Step 2: Fetching branches from database...`);
    const query = `
      SELECT 
        id,
        bank_id,
        branch_name,
        location,
        geo_limit,
        product,
        sales_manager_name,
        sales_manager_mobile,
        area_sales_manager_name,
        area_sales_manager_mobile,
        status,
        latitude,
        longitude
      FROM bank_branches
      WHERE status = 'active'
      AND location IS NOT NULL
    `;

    const result = await db.query(query);
    let branches = result.rows;

    if (branches.length === 0) {
      console.log(`❌ [FIND LENDER] No branches found in database\n`);
      return res.json({ 
        lenders: [], 
        message: 'No branches found in database',
        search_address: address,
        search_radius: radius
      });
    }

    console.log(`✅ [FIND LENDER] Found ${branches.length} total branches in database`);
    
    // Count branches with and without coordinates
    const branchesWithCoords = branches.filter(b => b.latitude && b.longitude);
    const branchesWithoutCoords = branches.filter(b => !b.latitude || !b.longitude);
    
    console.log(`   📊 Branches WITH coordinates in DB: ${branchesWithCoords.length}`);
    console.log(`   📊 Branches WITHOUT coordinates in DB: ${branchesWithoutCoords.length}\n`);

    // Get bank details
    const bankQuery = `SELECT id, name, logo_url, status FROM banks WHERE status = 'active'`;
    const bankResult = await db.query(bankQuery);
    const banksMap = {};
    bankResult.rows.forEach(bank => {
      banksMap[bank.id] = bank;
    });

    // Process branches - geocode missing ones and save to DB
    console.log(`🔍 [FIND LENDER] Step 3: Processing branch coordinates...`);
    let apiCallsCount = 0;
    let dbSaveCount = 0;
    
    const processedBranches = await Promise.all(
      branches.map(async (branch) => {
        let lat = branch.latitude;
        let lng = branch.longitude;
        let source = 'database';

        // If branch doesn't have coordinates, geocode and save
        if (!lat || !lng) {
          console.log(`\n   🔄 [BRANCH] Processing: ${branch.branch_name}`);
          console.log(`   📍 [BRANCH] Location: ${branch.location}`);
          console.log(`   ⚠️  [BRANCH] No coordinates in DB - calling Google Maps API...`);
          
          const coords = await geocodeAddress(branch.location);
          apiCallsCount++;
          
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
            source = 'google-maps-api';
            
            // Save coordinates to DB
            console.log(`   💾 [BRANCH] Saving coordinates to database...`);
            await db.query(
              `UPDATE bank_branches SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
              [lat, lng, branch.id]
            ).catch(err => console.error('Failed to save branch coordinates:', err));
            
            dbSaveCount++;
            console.log(`   ✅ [BRANCH] Coordinates saved to DB: lat=${lat}, lng=${lng}`);
          } else {
            console.log(`   ❌ [BRANCH] Failed to geocode address`);
          }
        } else {
          console.log(`\n   ✅ [BRANCH] ${branch.branch_name} - Using cached coordinates from DB: lat=${lat}, lng=${lng}`);
        }

        return {
          ...branch,
          latitude: lat,
          longitude: lng,
          source: source
        };
      })
    );

    console.log(`\n📊 [FIND LENDER] Coordinate Processing Summary:`);
    console.log(`   🌐 Google Maps API calls made: ${apiCallsCount}`);
    console.log(`   💾 Branches saved to DB: ${dbSaveCount}`);
    console.log(`   📦 Branches using cached DB coordinates: ${branches.length - apiCallsCount}\n`);

    // Calculate distances and filter
    console.log(`🔍 [FIND LENDER] Step 4: Calculating distances using Google Maps Distance Matrix API (Batch Mode)...`);
    
    // Use batch distance calculation for better performance
    const branchesWithDistance = await getBatchDistances(
      customerCoords.lat,
      customerCoords.lng,
      processedBranches
    );

    // Add geo limit info and filter
    const lendersWithDistance = branchesWithDistance.map(branch => {
      const branchGeoLimit = parseGeoLimit(branch.geo_limit);
      const isWithinServiceArea = branch.distance !== null && branchGeoLimit && branch.distance <= branchGeoLimit;

      return {
        ...branch,
        geo_limit_km: branchGeoLimit,
        within_radius: isWithinServiceArea
      };
    });

    // Filter branches within radius
    let filtered = lendersWithDistance.filter(l => l.within_radius && l.distance !== null);

    console.log(`✅ [FIND LENDER] Distance calculation complete`);
    console.log(`   📍 Branches where customer is within their service area: ${filtered.length}\n`);

    // Filter by case type if provided
    if (case_type) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(branch => {
        if (!branch.product) return true;
        const products = branch.product.toLowerCase().split(',').map(p => p.trim());
        return products.includes(case_type.toLowerCase());
      });
      console.log(`🎯 [FIND LENDER] Filtered by case type "${case_type}": ${beforeFilter} → ${filtered.length} branches\n`);
    }

    // Sort by distance
    filtered.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));

    // Group by bank
    console.log(`🔍 [FIND LENDER] Step 5: Grouping branches by bank...`);
    const lenderMap = {};
    filtered.forEach(branch => {
      const bank = banksMap[branch.bank_id];
      if (!bank) return;

      if (!lenderMap[branch.bank_id]) {
        lenderMap[branch.bank_id] = {
          bank_id: branch.bank_id,
          bank_name: bank.name,
          logo_url: bank.logo_url,
          branches: [],
          supports: {
            purchase: false,
            refinance: false,
            bt: false,
            credit_card: false
          }
        };
      }

      lenderMap[branch.bank_id].branches.push({
        branch_id: branch.id,
        branch_name: branch.branch_name,
        location: branch.location,
        distance: branch.distance,
        geo_limit: branch.geo_limit,
        geo_limit_km: branch.geo_limit_km,
        latitude: parseFloat(branch.latitude),
        longitude: parseFloat(branch.longitude),
        sales_manager_name: branch.sales_manager_name,
        sales_manager_mobile: branch.sales_manager_mobile,
        area_sales_manager_name: branch.area_sales_manager_name,
        area_sales_manager_mobile: branch.area_sales_manager_mobile
      });
      if (branch.product) {
        const products = branch.product.toLowerCase().split(',').map(p => p.trim());
        if (products.includes('new car - purchase')) lenderMap[branch.bank_id].supports.purchase = true;
        if (products.includes('used car - purchase')) lenderMap[branch.bank_id].supports.purchase = true;
        if (products.includes('used car - refinance')) lenderMap[branch.bank_id].supports.refinance = true;
        if (products.includes('used car - top-up')) lenderMap[branch.bank_id].supports.refinance = true;
        if (products.includes('used car - bt')) lenderMap[branch.bank_id].supports.bt = true;
      }
    });

    const lenders = Object.values(lenderMap);

    console.log(`✅ [FIND LENDER] Grouped into ${lenders.length} lenders\n`);

    console.log(`========================================`);
    console.log(`✅ [FIND LENDER] Process Complete!`);
    console.log(`========================================`);
    console.log(`📊 Final Results:`);
    console.log(`   🏦 Total Lenders: ${lenders.length}`);
    console.log(`   🏢 Total Branches: ${filtered.length}`);
    console.log(`   🌐 Google API Calls: ${apiCallsCount}`);
    console.log(`   💾 DB Saves: ${dbSaveCount}`);
    console.log(`========================================\n`);

    res.json({
      lenders,
      total_lenders: lenders.length,
      search_address: address,
      search_coordinates: customerCoords,
      search_radius: radius,
      case_type: case_type || 'all',
      message: `Found ${lenders.length} lenders with ${filtered.length} branches where customer is within service area`,
      stats: {
        google_api_calls: apiCallsCount,
        db_saves: dbSaveCount,
        cached_from_db: branches.length - apiCallsCount
      }
    });
  } catch (error) {
    console.error('❌ [FIND LENDER] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const findLendersNearby = async (req, res) => {
  try {
    const { latitude, longitude, case_type, radius = 50 } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const query = `
      SELECT 
        id,
        bank_id,
        branch_name,
        location,
        geo_limit,
        product,
        sales_manager_name,
        sales_manager_mobile,
        area_sales_manager_name,
        area_sales_manager_mobile,
        status,
        latitude,
        longitude
      FROM bank_branches
      WHERE status = 'active'
      AND latitude IS NOT NULL AND longitude IS NOT NULL
    `;

    const result = await db.query(query);
    const branches = result.rows;

    if (branches.length === 0) {
      return res.json({ lenders: [], message: 'No lenders found in database' });
    }

    const bankQuery = `SELECT id, name, logo_url, status FROM banks WHERE status = 'active'`;
    const bankResult = await db.query(bankQuery);
    const banksMap = {};
    bankResult.rows.forEach(bank => {
      banksMap[bank.id] = bank;
    });

    const lendersWithDistance = await getBatchDistances(
      latitude,
      longitude,
      branches
    );

    // Add geo limit info and filter
    const filtered = lendersWithDistance.map(branch => {
      const branchGeoLimit = parseGeoLimit(branch.geo_limit);
      const effectiveLimit = branchGeoLimit || radius;
      const within_radius = branch.distance !== null && branch.distance <= Math.min(radius, effectiveLimit);

      return {
        ...branch,
        geo_limit_km: branchGeoLimit,
        within_radius: within_radius
      };
    }).filter(l => l.within_radius);

    if (case_type) {
      filtered = filtered.filter(branch => {
        if (!branch.product) return true;
        const products = branch.product.toLowerCase().split(',').map(p => p.trim());
        return products.includes(case_type.toLowerCase());
      });
    }

    filtered.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));

    const lenderMap = {};
    filtered.forEach(branch => {
      const bank = banksMap[branch.bank_id];
      if (!bank) return;

      if (!lenderMap[branch.bank_id]) {
        lenderMap[branch.bank_id] = {
          bank_id: branch.bank_id,
          bank_name: bank.name,
          logo_url: bank.logo_url,
          branches: [],
          supports: {
            purchase: false,
            refinance: false,
            bt: false
          }
        };
      }

      lenderMap[branch.bank_id].branches.push({
        branch_id: branch.id,
        branch_name: branch.branch_name,
        location: branch.location,
        distance: branch.distance,
        geo_limit: branch.geo_limit,
        geo_limit_km: branch.geo_limit_km,
        latitude: parseFloat(branch.latitude),
        longitude: parseFloat(branch.longitude),
        sales_manager_name: branch.sales_manager_name,
        sales_manager_mobile: branch.sales_manager_mobile,
        area_sales_manager_name: branch.area_sales_manager_name,
        area_sales_manager_mobile: branch.area_sales_manager_mobile
      });

      if (branch.product) {
        const products = branch.product.toLowerCase().split(',').map(p => p.trim());
        if (products.includes('new car - purchase')) lenderMap[branch.bank_id].supports.purchase = true;
        if (products.includes('used car - purchase')) lenderMap[branch.bank_id].supports.purchase = true;
        if (products.includes('used car - refinance')) lenderMap[branch.bank_id].supports.refinance = true;
        if (products.includes('used car - top-up')) lenderMap[branch.bank_id].supports.refinance = true;
        if (products.includes('used car - bt')) lenderMap[branch.bank_id].supports.bt = true;
      }
    });

    const lenders = Object.values(lenderMap);

    res.json({
      lenders,
      total_lenders: lenders.length,
      search_location: { latitude, longitude },
      search_radius: radius,
      case_type: case_type || 'all'
    });
  } catch (error) {
    console.error('Find lenders error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getLenderDetails = async (req, res) => {
  try {
    const { bank_id } = req.params;

    const bankResult = await db.query(
      'SELECT * FROM banks WHERE id = $1 AND status = $2',
      [bank_id, 'active']
    );

    if (bankResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bank not found' });
    }

    const branchesResult = await db.query(
      `SELECT * FROM bank_branches 
       WHERE bank_id = $1 AND status = 'active'
       ORDER BY branch_name`,
      [bank_id]
    );

    res.json({
      bank: bankResult.rows[0],
      branches: branchesResult.rows
    });
  } catch (error) {
    console.error('Get lender details error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateBranchCoordinates = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update coordinates' });
    }

    const { branch_id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const result = await db.query(
      `UPDATE bank_branches 
       SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [latitude, longitude, branch_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({
      message: 'Branch coordinates updated',
      branch: result.rows[0]
    });
  } catch (error) {
    console.error('Update coordinates error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const geocodeBranch = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can geocode' });
    }

    const { branch_id, address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const coords = await geocodeAddress(address);

    if (!coords) {
      return res.status(400).json({ error: 'Address not found. Please verify the address or use the map to set coordinates manually.' });
    }

    const { lat, lng } = coords;

    const result = await db.query(
      `UPDATE bank_branches 
       SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [lat, lng, branch_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({
      message: 'Branch geocoded successfully',
      branch: result.rows[0],
      coordinates: { latitude: lat, longitude: lng }
    });
  } catch (error) {
    console.error('Geocode branch error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSearchHistory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM lender_searches 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const saveSearch = async (req, res) => {
  try {
    const { latitude, longitude, case_type, results_count } = req.body;

    await db.query(
      `INSERT INTO lender_searches (user_id, latitude, longitude, case_type, results_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, latitude, longitude, case_type || null, results_count || 0]
    ).catch(() => {});

    res.json({ success: true });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const saveAddressCoordinates = async (req, res) => {
  try {
    const { address, latitude, longitude } = req.body;

    if (!address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'address, latitude, and longitude are required' });
    }

    const result = await db.query(
      `INSERT INTO address_coordinates (user_id, address, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (address) DO UPDATE SET latitude = $3, longitude = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, address, latitude, longitude]
    );

    console.log(`📍 Saved coordinates for: ${address}`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Save address coordinates error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAddressCoordinates = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }

    const result = await db.query(
      `SELECT latitude, longitude FROM address_coordinates WHERE address = $1 LIMIT 1`,
      [address]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Found cached coordinates for: ${address}`);
      return res.json({
        found: true,
        lat: result.rows[0].latitude,
        lng: result.rows[0].longitude
      });
    }

    res.json({ found: false });
  } catch (error) {
    console.error('Get address coordinates error:', error);
    res.status(500).json({ error: error.message });
  }
};
