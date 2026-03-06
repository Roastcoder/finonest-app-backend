import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const generateLoanNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `LN${timestamp}${random}`.toUpperCase();
};

export const calculateEMI = (principal, rate, tenure) => {
  const monthlyRate = rate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi * 100) / 100;
};
