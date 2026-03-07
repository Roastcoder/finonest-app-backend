export const fetchCityStateByPincode = async (pincode) => {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();
    if (data[0].Status === 'Success') {
      return {
        city: data[0].PostOffice[0].District,
        state: data[0].PostOffice[0].State
      };
    }
    return null;
  } catch (error) {
    console.error('Pincode API error:', error);
    return null;
  }
};

export const verifyPAN = async (panNumber) => {
  return { valid: true, name: 'Sample Name' };
};

export const lookupRC = async (vehicleNumber) => {
  return { valid: true, details: {} };
};

export const sendOTP = async (phone, otp) => {
  console.log(`Sending OTP ${otp} to ${phone}`);
  return true;
};

export const sendSMS = async (phone, message) => {
  console.log(`Sending SMS to ${phone}: ${message}`);
  return true;
};

export const sendEmail = async (to, subject, body) => {
  console.log(`Sending email to ${to}: ${subject}`);
  return true;
};
