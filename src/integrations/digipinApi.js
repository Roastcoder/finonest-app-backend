import axios from 'axios';

const DIGIPIN_API_URL = process.env.DIGIPIN_API_URL || 'https://api.digipin.in/api';

/**
 * Encode latitude and longitude to DIGIPIN
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>} DIGIPIN code
 */
export const encodeToDigipin = async (latitude, longitude) => {
  try {
    const response = await axios.get(`${DIGIPIN_API_URL}/digipin/encode`, {
      params: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      timeout: 5000
    });

    if (response.data && response.data.digipin) {
      return response.data.digipin;
    }
    return null;
  } catch (error) {
    console.error('DIGIPIN encode error:', error.message);
    return null;
  }
};

/**
 * Decode DIGIPIN to latitude and longitude
 * @param {string} digipin
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const decodeFromDigipin = async (digipin) => {
  try {
    const response = await axios.get(`${DIGIPIN_API_URL}/digipin/decode`, {
      params: {
        digipin: digipin.toUpperCase()
      },
      timeout: 5000
    });

    if (response.data && response.data.latitude && response.data.longitude) {
      return {
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude)
      };
    }
    return null;
  } catch (error) {
    console.error('DIGIPIN decode error:', error.message);
    return null;
  }
};

/**
 * Get DIGIPIN info (includes grid cell details)
 * @param {string} digipin
 * @returns {Promise<object>}
 */
export const getDigipinInfo = async (digipin) => {
  try {
    const response = await axios.get(`${DIGIPIN_API_URL}/digipin/info`, {
      params: {
        digipin: digipin.toUpperCase()
      },
      timeout: 5000
    });

    return response.data || null;
  } catch (error) {
    console.error('DIGIPIN info error:', error.message);
    return null;
  }
};
