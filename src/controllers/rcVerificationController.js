import fetch from 'node-fetch';
import db from '../config/database.js';

const SUREPASS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NjM5ODg5MiwianRpIjoiMjdiNjdiNWEtZjkyZC00YTZmLTk2NmMtMDhhZjc4ZjAwNmI2IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmZpbm9uZXN0aW5kaWFAc3VyZXBhc3MuaW8iLCJuYmYiOjE3NjYzOTg4OTIsImV4cCI6MjM5NzExODg5MiwiZW1haWwiOiJmaW5vbmVzdGluZGlhQHN1cmVwYXNzLmlvIiwidGVuYW50X2lkIjoibWFpbiIsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJ1c2VyIl19fQ.dl1S5S3OxNs3hwxkwtLhcTAN6CmIlYa_hg4yOl5ASlg';

// Ensure rc_cache table exists with all columns
const ensureRcCacheTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_cache (
      id SERIAL PRIMARY KEY,
      rc_number VARCHAR(20) UNIQUE NOT NULL,
      rc_data JSONB NOT NULL,
      challan_data JSONB,
      api_type VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // Add api_type column if it doesn't exist (for existing tables)
  await db.query(`
    ALTER TABLE rc_cache ADD COLUMN IF NOT EXISTS api_type VARCHAR(20)
  `);
};
ensureRcCacheTable().catch(console.error);

export const getRCData = async (req, res) => {
  try {
    const { rc_number } = req.params;

    if (!rc_number) {
      return res.status(400).json({ error: 'RC number is required' });
    }

    const rcNumberUpper = rc_number.toUpperCase();

    // Fetch from cache
    const cached = await db.query('SELECT rc_data FROM rc_cache WHERE rc_number = $1', [rcNumberUpper]);
    
    if (cached.rows.length === 0) {
      return res.status(404).json({ error: 'RC data not found. Please verify RC first.' });
    }

    const rcData = typeof cached.rows[0].rc_data === 'string' 
      ? JSON.parse(cached.rows[0].rc_data) 
      : cached.rows[0].rc_data;

    res.json({
      success: true,
      data: rcData
    });
  } catch (error) {
    console.error('Get RC data error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyRC = async (req, res) => {
  try {
    const { rc_number } = req.body;

    if (!rc_number) {
      return res.status(400).json({ error: 'RC number is required' });
    }

    const rcNumberUpper = rc_number.toUpperCase();

    // Step 1: Check DB cache first
    const cached = await db.query('SELECT rc_data, challan_data, api_type FROM rc_cache WHERE rc_number = $1', [rcNumberUpper]);
    if (cached.rows.length > 0) {
      console.log(`RC ${rcNumberUpper} found in cache (${cached.rows[0].api_type})`);
      return res.json({
        success: true,
        from_cache: true,
        source: 'database',
        data: {
          rc_details: cached.rows[0].rc_data,
          challan_info: cached.rows[0].challan_data || { status: 'No', count: 0, challans: [] }
        }
      });
    }

    let rcData = null;
    let apiType = null;

    // Step 2: Try non-masked API first
    try {
      console.log(`Trying non-masked API for RC ${rcNumberUpper}`);
      const fullResponse = await fetch('https://kyc-api.surepass.io/api/v1/rc/rc-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUREPASS_TOKEN}`
        },
        body: JSON.stringify({ id_number: rc_number })
      });

      const fullData = await fullResponse.json();

      if (fullData.success && fullData.data) {
        console.log(`Non-masked API success for RC ${rcNumberUpper}`);
        rcData = fullData;
        apiType = 'non-masked';
      } else {
        console.log(`Non-masked API failed for RC ${rcNumberUpper}:`, fullData.message);
      }
    } catch (fullError) {
      console.error('Non-masked API error:', fullError.message);
    }

    // Step 3: Only if non-masked failed, try masked API
    if (!rcData) {
      try {
        console.log(`Trying masked API for RC ${rcNumberUpper}`);
        const maskedResponse = await fetch('https://kyc-api.surepass.io/api/v1/rc/rc-lite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUREPASS_TOKEN}`
          },
          body: JSON.stringify({ id_number: rc_number })
        });

        const maskedData = await maskedResponse.json();

        if (maskedData.success && maskedData.data) {
          console.log(`Masked API success for RC ${rcNumberUpper}`);
          rcData = maskedData;
          apiType = 'masked';
        } else {
          console.log(`Masked API also failed for RC ${rcNumberUpper}:`, maskedData.message);
          return res.status(400).json({ error: 'Failed to fetch RC details', data: maskedData });
        }
      } catch (maskedError) {
        console.error('Masked API error:', maskedError.message);
        return res.status(500).json({ error: 'Both non-masked and masked APIs failed' });
      }
    }

    const rc = rcData.data;
    let challanInfo = { status: 'No', count: 0, challans: [] };

    // Log the raw RC data being saved
    console.log('\n=== RAW RC DATA FROM API ===');
    console.log('RC Number:', rc.rc_number);
    console.log('All fields in response:', Object.keys(rc).sort());
    console.log('Full RC object:', JSON.stringify(rc, null, 2));
    console.log('===========================\n');

    // Fetch challan details
    try {
      const challanResponse = await fetch('https://kyc-api.surepass.io/api/v1/rc/rc-related/challan-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUREPASS_TOKEN}`
        },
        body: JSON.stringify({
          rc_number,
          chassis_number: rc.vehicle_chasi_number || rc.chassis_number || '',
          engine_number: rc.vehicle_engine_number || rc.engine_number || '',
          state_only: false,
          state_portal: ['DL', 'TS', 'KA', 'GJ', 'RJ', 'MH', 'UP', 'HR']
        })
      });

      const challanData = await challanResponse.json();

      if (challanData.success && challanData.data?.challan_details?.challans) {
        const challans = challanData.data.challan_details.challans;
        const pendingChallans = challans.filter(c => c.challan_status === 'Pending');
        challanInfo = {
          status: pendingChallans.length > 0 ? 'Yes' : 'No',
          count: pendingChallans.length,
          challans: pendingChallans
        };
      }
    } catch (challanError) {
      console.error('Challan check failed:', challanError);
    }

    // Save to DB cache - storing the complete raw response
    const rcDataToSave = JSON.stringify(rc);
    console.log(`\n📊 Saving RC ${rcNumberUpper} to database...`);
    console.log(`Data size: ${rcDataToSave.length} bytes`);
    console.log(`API Type: ${apiType}`);
    
    await db.query(
      `INSERT INTO rc_cache (rc_number, rc_data, challan_data, api_type, created_at) 
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (rc_number) DO UPDATE SET 
         rc_data = $2, 
         challan_data = $3, 
         api_type = $4,
         created_at = NOW()`,
      [rcNumberUpper, rcDataToSave, JSON.stringify(challanInfo), apiType]
    );

    console.log(`✅ RC ${rcNumberUpper} saved to cache (${apiType})\n`);

    res.json({
      success: true,
      from_cache: false,
      source: apiType,
      data: {
        rc_details: rc,
        challan_info: challanInfo
      }
    });
  } catch (error) {
    console.error('RC verification error:', error);
    res.status(500).json({ error: error.message });
  }
};
