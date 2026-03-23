import axios from 'axios';

const SUREPASS_BASE_URL = 'https://kyc-api.surepass.app/api/v1';
const SUREPASS_TOKEN = process.env.SUREPASS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NjM5ODg5MiwianRpIjoiMjdiNjdiNWEtZjkyZC00YTZmLTk2NmMtMDhhZjc4ZjAwNmI2IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmZpbm9uZXN0aW5kaWFAc3VyZXBhc3MuaW8iLCJuYmYiOjE3NjYzOTg4OTIsImV4cCI6MjM5NzExODg5MiwiZW1haWwiOiJmaW5vbmVzdGluZGlhQHN1cmVwYXNzLmlvIiwidGVuYW50X2lkIjoibWFpbiIsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJ1c2VyIl19fQ.dl1S5S3OxNs3hwxkwtLhcTAN6CmIlYa_hg4yOl5ASlg';

export const verifyPanComprehensive = async (panNumber) => {
  try {
    const response = await axios.post(
      `${SUREPASS_BASE_URL}/pan/pan-comprehensive`,
      {
        id_number: panNumber
      },
      {
        headers: {
          'Authorization': `Bearer ${SUREPASS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return {
      success: response.data.success,
      data: response.data.data,
      status_code: response.data.status_code,
      message: response.data.message
    };
  } catch (error) {
    console.error('SurePass PAN API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendAadhaarOtpSurepass = async (aadhaarNumber) => {
  try {
    const response = await axios.post(
      `${SUREPASS_BASE_URL}/aadhaar/generate-otp`,
      {
        id_number: aadhaarNumber
      },
      {
        headers: {
          'Authorization': `Bearer ${SUREPASS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return {
      success: response.data.success,
      data: response.data.data,
      status_code: response.data.status_code,
      message: response.data.message
    };
  } catch (error) {
    console.error('SurePass Aadhaar OTP API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyAadhaarOtpSurepass = async (clientId, otp) => {
  try {
    const response = await axios.post(
      `${SUREPASS_BASE_URL}/aadhaar/submit-otp`,
      {
        client_id: clientId,
        otp: otp
      },
      {
        headers: {
          'Authorization': `Bearer ${SUREPASS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return {
      success: response.data.success,
      data: response.data.data,
      status_code: response.data.status_code,
      message: response.data.message
    };
  } catch (error) {
    console.error('SurePass Aadhaar Verify OTP API Error:', error.response?.data || error.message);
    throw error;
  }
};