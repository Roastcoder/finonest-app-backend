import { verifyPanComprehensive } from '../integrations/surepassApi.js';
import db from '../config/database.js';

// Verify PAN and get comprehensive data
export const verifyAndSavePan = async (req, res) => {
  try {
    const { pan_number } = req.body;
    
    if (!pan_number || pan_number.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid PAN number format' 
      });
    }

    // Check if PAN already exists in database
    const existingPan = await db.query('SELECT id, name, full_name FROM users WHERE pan_number = $1', [pan_number]);
    if (existingPan.rows.length > 0) {
      const existingUserName = existingPan.rows[0].name || existingPan.rows[0].full_name;
      return res.status(400).json({ 
        success: false,
        error: `This PAN number is already registered with ${existingUserName}. Please use a different PAN number or contact support.`,
        errorType: 'PAN_EXISTS'
      });
    }

    console.log('Verifying PAN:', pan_number);
    
    // Verify PAN using SurePass API
    const result = await verifyPanComprehensive(pan_number);
    
    if (result.success && result.data) {
      // Extract and structure the data
      const panData = {
        client_id: result.data.client_id,
        pan_number: result.data.pan_number,
        full_name: result.data.full_name,
        full_name_split: result.data.full_name_split,
        masked_aadhaar: result.data.masked_aadhaar,
        address: result.data.address,
        email: result.data.email,
        phone_number: result.data.phone_number,
        gender: result.data.gender,
        dob: result.data.dob,
        aadhaar_linked: result.data.aadhaar_linked,
        dob_verified: result.data.dob_verified,
        category: result.data.category,
        less_info: result.data.less_info
      };
      
      return res.json({
        success: true,
        verified: true,
        data: panData,
        message: 'PAN verification successful'
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        error: result.message || 'PAN verification failed',
        data: result.data || null
      });
    }
    
  } catch (error) {
    console.error('PAN verification error:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'PAN verification service authentication failed. Please contact administrator.'
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'PAN verification service temporarily unavailable. Please try again later.'
    });
  }
};

// Store Aadhaar verification data
export const saveAadhaarData = async (req, res) => {
  try {
    const { aadhaar_data, user_id } = req.body;
    
    if (!aadhaar_data || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Aadhaar data and user ID are required'
      });
    }
    
    // Update user with Aadhaar data
    await db.query(`
      UPDATE users SET 
        aadhaar_data = $1,
        aadhaar_verified = true,
        father_name = $2,
        updated_at = $3
      WHERE id = $4
    `, [
      JSON.stringify(aadhaar_data),
      aadhaar_data.father_name || null,
      new Date(),
      user_id
    ]);
    
    res.json({
      success: true,
      message: 'Aadhaar data saved successfully'
    });
    
  } catch (error) {
    console.error('Save Aadhaar data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save Aadhaar data'
    });
  }
};