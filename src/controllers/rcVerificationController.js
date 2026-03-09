import fetch from 'node-fetch';

const SUREPASS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NjM5ODg5MiwianRpIjoiMjdiNjdiNWEtZjkyZC00YTZmLTk2NmMtMDhhZjc4ZjAwNmI2IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmZpbm9uZXN0aW5kaWFAc3VyZXBhc3MuaW8iLCJuYmYiOjE3NjYzOTg4OTIsImV4cCI6MjM5NzExODg5MiwiZW1haWwiOiJmaW5vbmVzdGluZGlhQHN1cmVwYXNzLmlvIiwidGVuYW50X2lkIjoibWFpbiIsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJ1c2VyIl19fQ.dl1S5S3OxNs3hwxkwtLhcTAN6CmIlYa_hg4yOl5ASlg';

export const verifyRC = async (req, res) => {
  try {
    const { rc_number } = req.body;

    if (!rc_number) {
      return res.status(400).json({ error: 'RC number is required' });
    }

    // Fetch RC details
    const rcResponse = await fetch('https://kyc-api.surepass.io/api/v1/rc/rc-full', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUREPASS_TOKEN}`
      },
      body: JSON.stringify({ id_number: rc_number })
    });

    const rcData = await rcResponse.json();

    if (!rcData.success) {
      return res.status(400).json({ error: 'Failed to fetch RC details', data: rcData });
    }

    const rc = rcData.data;
    let challanInfo = { status: 'No', count: 0, challans: [] };

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

    res.json({
      success: true,
      data: {
        rc_details: rcData.data,
        challan_info: challanInfo
      }
    });
  } catch (error) {
    console.error('RC verification error:', error);
    res.status(500).json({ error: error.message });
  }
};
