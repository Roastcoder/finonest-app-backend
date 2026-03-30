import db from '../config/database.js';
import axios from 'axios';

const OSRM_URL = process.env.OSRM_URL || 'http://router.project-osrm.org';

async function getDistanceBetweenAddresses(address1, address2) {
  try {
    // Geocode both addresses
    const geocode = async (addr) => {
      const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
      const variations = [
        addr,
        parts.slice(-2).join(', '),
        parts.slice(-3).join(', '),
        parts[parts.length - 1]
      ].filter(Boolean);

      for (const searchAddr of variations) {
        try {
          const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
              q: searchAddr,
              format: 'json',
              limit: 1
            },
            headers: { 'User-Agent': 'Finonest-App' },
            timeout: 5000
          });

          if (response.data && response.data.length > 0) {
            return {
              lat: parseFloat(response.data[0].lat),
              lng: parseFloat(response.data[0].lon)
            };
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    };

    const coords1 = await geocode(address1);
    const coords2 = await geocode(address2);

    if (!coords1 || !coords2) {
      return null;
    }

    // Calculate distance using OSRM
    const response = await axios.get(
      `${OSRM_URL}/route/v1/driving/${coords2.lng},${coords2.lat};${coords1.lng},${coords1.lat}?overview=false`,
      { timeout: 5000 }
    );

    if (response.data.routes && response.data.routes.length > 0) {
      return Math.round(response.data.routes[0].distance / 1000);
    }
    return null;
  } catch (error) {
    console.error('Distance calculation error:', error.message);
    return null;
  }
}

function parseGeoLimit(geoLimit) {
  if (!geoLimit) return null;
  const match = String(geoLimit).match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

export const findLendersByAddress = async (req, res) => {
  try {
    const { address, case_type, radius = 50 } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    console.log(`🔍 Searching for lenders near: ${address}`);

    // Get all active branches with their addresses
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
        status
      FROM bank_branches
      WHERE status = 'active'
      AND location IS NOT NULL
    `;

    const result = await db.query(query);
    const branches = result.rows;

    if (branches.length === 0) {
      return res.json({ 
        lenders: [], 
        message: 'No branches found in database'
      });
    }

    console.log(`📍 Found ${branches.length} branches to check`);

    // Get bank details
    const bankQuery = `SELECT id, name, logo_url, status FROM banks WHERE status = 'active'`;
    const bankResult = await db.query(bankQuery);
    const banksMap = {};
    bankResult.rows.forEach(bank => {
      banksMap[bank.id] = bank;
    });

    // Calculate distances between customer address and each branch
    const lendersWithDistance = await Promise.all(
      branches.map(async (branch) => {
        const distance = await getDistanceBetweenAddresses(address, branch.location);

        const branchGeoLimit = parseGeoLimit(branch.geo_limit);
        const effectiveLimit = branchGeoLimit || radius;

        return {
          ...branch,
          distance: distance,
          geo_limit_km: branchGeoLimit,
          within_radius: distance !== null && distance <= Math.min(radius, effectiveLimit)
        };
      })
    );

    // Filter branches within radius
    let filtered = lendersWithDistance.filter(l => l.within_radius && l.distance !== null);

    console.log(`✅ Found ${filtered.length} branches within radius`);

    // Filter by case type if provided
    if (case_type) {
      filtered = filtered.filter(branch => {
        if (!branch.product) return true;
        const products = branch.product.toLowerCase().split(',').map(p => p.trim());
        return products.includes(case_type.toLowerCase());
      });
    }

    // Sort by distance
    filtered.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));

    // Group by bank
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
        sales_manager_name: branch.sales_manager_name,
        sales_manager_mobile: branch.sales_manager_mobile,
        area_sales_manager_name: branch.area_sales_manager_name,
        area_sales_manager_mobile: branch.area_sales_manager_mobile
      });

      // Update product support
      if (branch.product) {
        const products = branch.product.toLowerCase().split(',').map(p => p.trim());
        if (products.includes('purchase')) lenderMap[branch.bank_id].supports.purchase = true;
        if (products.includes('refinance')) lenderMap[branch.bank_id].supports.refinance = true;
        if (products.includes('bt')) lenderMap[branch.bank_id].supports.bt = true;
        if (products.includes('credit card')) lenderMap[branch.bank_id].supports.credit_card = true;
      }
    });

    const lenders = Object.values(lenderMap);

    res.json({
      lenders,
      total_lenders: lenders.length,
      search_address: address,
      search_radius: radius,
      case_type: case_type || 'all',
      message: `Found ${lenders.length} lenders with ${filtered.length} branches`
    });
  } catch (error) {
    console.error('Find lenders by address error:', error);
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

    const lendersWithDistance = await Promise.all(
      branches.map(async (branch) => {
        let distance = null;
        if (branch.latitude && branch.longitude) {
          try {
            const response = await axios.get(
              `${OSRM_URL}/route/v1/driving/${branch.longitude},${branch.latitude};${longitude},${latitude}?overview=false`,
              { timeout: 5000 }
            );
            if (response.data.routes && response.data.routes.length > 0) {
              distance = Math.round(response.data.routes[0].distance / 1000);
            }
          } catch (e) {
            console.error('OSRM error:', e.message);
          }
        }

        const branchGeoLimit = parseGeoLimit(branch.geo_limit);
        const effectiveLimit = branchGeoLimit || radius;

        return {
          ...branch,
          distance: distance,
          geo_limit_km: branchGeoLimit,
          within_radius: distance !== null && distance <= Math.min(radius, effectiveLimit)
        };
      })
    );

    let filtered = lendersWithDistance.filter(l => l.within_radius);

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
        sales_manager_name: branch.sales_manager_name,
        sales_manager_mobile: branch.sales_manager_mobile,
        area_sales_manager_name: branch.area_sales_manager_name,
        area_sales_manager_mobile: branch.area_sales_manager_mobile
      });

      if (branch.product) {
        const products = branch.product.toLowerCase().split(',').map(p => p.trim());
        if (products.includes('purchase')) lenderMap[branch.bank_id].supports.purchase = true;
        if (products.includes('refinance')) lenderMap[branch.bank_id].supports.refinance = true;
        if (products.includes('bt')) lenderMap[branch.bank_id].supports.bt = true;
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

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'Finonest-App'
        },
        timeout: 5000
      });

      if (!response.data || response.data.length === 0) {
        return res.status(400).json({ error: 'Address not found' });
      }

      const { lat, lon } = response.data[0];

      const result = await db.query(
        `UPDATE bank_branches 
         SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [parseFloat(lat), parseFloat(lon), branch_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      res.json({
        message: 'Branch geocoded successfully',
        branch: result.rows[0],
        coordinates: { latitude: lat, longitude: lon }
      });
    } catch (geocodeError) {
      console.error('Geocoding error:', geocodeError.message);
      return res.status(400).json({ error: 'Could not geocode address' });
    }
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
