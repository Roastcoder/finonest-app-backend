import axios from 'axios';
import { verifyPanComprehensive } from '../integrations/surepassApi.js';

const KYC_BASE_URL = process.env.KYC_BASE_URL;
const KYC_CLIENT_USER_ID = process.env.KYC_CLIENT_USER_ID;
const KYC_SECRET_KEY = process.env.KYC_SECRET_KEY;
const KYC_ACCESS_KEY = process.env.KYC_ACCESS_KEY;
const KYC_AADHAAR_OTP_SERVICE_ID = process.env.KYC_AADHAAR_OTP_SERVICE_ID;
const KYC_AADHAAR_KYC_SERVICE_ID = process.env.KYC_AADHAAR_KYC_SERVICE_ID;

// Helper function to check if KYC is configured
const isKycConfigured = () => {
  return KYC_BASE_URL && KYC_CLIENT_USER_ID && KYC_SECRET_KEY && KYC_ACCESS_KEY;
};

export const verifyPan = async (req, res) => {
  try {
    const { pan_number } = req.body;
    
    if (!pan_number || pan_number.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid PAN number format' 
      });
    }

    console.log('PAN verification requested for:', pan_number);
    
    // Use SurePass API for PAN verification
    const result = await verifyPanComprehensive(pan_number);
    
    if (result.success) {
      return res.json({
        success: true,
        data: {
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
        },
        message: 'PAN verification successful'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.message || 'PAN verification failed'
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

export const sendAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar_number } = req.body;
    
    if (!aadhaar_number || aadhaar_number.length !== 12) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Aadhaar number format' 
      });
    }

    console.log('Sending Aadhaar OTP for:', aadhaar_number);

    // Check if Neokred KYC is configured
    if (!isKycConfigured()) {
      console.error('KYC API not configured properly');
      
      // For development: return mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock Aadhaar OTP for development');
        return res.json({
          success: true,
          client_id: 'mock_client_id_' + Date.now(),
          message: 'Mock OTP sent successfully (development mode)'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'KYC service not configured. Please contact administrator.'
      });
    }

    // Neokred API call for Aadhaar OTP using correct v2 endpoint
    const requestData = {
      uid: aadhaar_number
    };

    console.log('Sending request to Neokred:', {
      url: `${KYC_BASE_URL}/core-svc/api/v2/exp/validation-service/aadhaar-kyc-otp`,
      data: requestData
    });

    const response = await axios.post(
      `${KYC_BASE_URL}/core-svc/api/v2/exp/validation-service/aadhaar-kyc-otp`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'client-user-id': KYC_CLIENT_USER_ID,
          'secret-key': KYC_SECRET_KEY,
          'access-key': KYC_ACCESS_KEY,
          'service-id': KYC_AADHAAR_OTP_SERVICE_ID
        },
        timeout: 30000
      }
    );

    console.log('Aadhaar OTP Response:', response.data);

    if (response.data.success || response.data.status === 'success' || response.data.sessionId) {
      res.json({
        success: true,
        client_id: response.data.sessionId || response.data.data?.sessionId || response.data.client_id,
        session_id: response.data.sessionId,
        message: 'OTP sent successfully'
      });
    } else {
      console.error('Aadhaar OTP failed:', response.data);
      res.status(400).json({
        success: false,
        error: response.data.message || response.data.error || 'Failed to send OTP'
      });
    }
  } catch (error) {
    console.error('Aadhaar OTP error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: 'Request timeout. Please try again.'
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'KYC service authentication failed. Please contact administrator.'
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
      error: 'Aadhaar OTP service temporarily unavailable. Please try again later.'
    });
  }
};

export const verifyAadhaarOtp = async (req, res) => {
  try {
    const { client_id, otp, session_id } = req.body;
    const sessionIdToUse = session_id || client_id;
    
    if (!sessionIdToUse || !otp || otp.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP or session ID' 
      });
    }

    console.log('Verifying Aadhaar OTP for session_id:', sessionIdToUse);

    // For development: return mock data immediately
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock Aadhaar OTP verification for development');
      return res.json({
        success: true,
        data: {
          full_name: 'MOCK AADHAAR USER',
          aadhaar_number: '************',
          address: 'Mock Address, Mock City, Mock State',
          email: 'mock@example.com',
          message: 'Mock OTP verification successful (development mode)'
        }
      });
    }

    if (!isKycConfigured()) {
      console.error('KYC API not configured properly');
      return res.status(500).json({
        success: false,
        error: 'KYC service not configured. Please contact administrator.'
      });
    }

    // Neokred API call for Aadhaar OTP verification using correct v2 endpoint
    const requestData = {
      sessionId: sessionIdToUse,
      otp: otp
    };

    const response = await axios.post(
      `${KYC_BASE_URL}/core-svc/api/v2/exp/validation-service/aadhaar-kyc`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'client-user-id': KYC_CLIENT_USER_ID,
          'secret-key': KYC_SECRET_KEY,
          'access-key': KYC_ACCESS_KEY,
          'service-id': KYC_AADHAAR_KYC_SERVICE_ID
        },
        timeout: 30000
      }
    );

    console.log('Aadhaar OTP Verification Response:', response.data);

    if (response.data.success || response.data.status === 'success' || response.data.data) {
      const responseData = response.data.data || response.data.result || response.data;
      
      res.json({
        success: true,
        data: {
          full_name: responseData.full_name || responseData.name,
          aadhaar_number: responseData.aadhaar_number || responseData.uid || '************',
          address: responseData.address || responseData.full_address,
          email: responseData.email,
          phone: responseData.phone || responseData.mobile,
          date_of_birth: responseData.date_of_birth || responseData.dob,
          gender: responseData.gender,
          father_name: responseData.father_name,
          message: 'Aadhaar verification successful'
        }
      });
    } else {
      console.error('Aadhaar OTP verification failed:', response.data);
      res.status(400).json({
        success: false,
        error: response.data.message || response.data.error || 'OTP verification failed'
      });
    }
  } catch (error) {
    console.error('Aadhaar OTP verification error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        error: 'Request timeout. Please try again.'
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'KYC service authentication failed. Please contact administrator.'
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
      error: 'OTP verification service temporarily unavailable. Please try again later.'
    });
  }
};