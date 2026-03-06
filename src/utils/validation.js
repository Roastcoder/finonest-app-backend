import { body } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const signupValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'sales', 'accountant'])
];

export const loanValidation = [
  body('loan_number').notEmpty().withMessage('Loan number required'),
  body('customer_name').notEmpty().withMessage('Customer name required'),
  body('loan_amount').isFloat({ min: 0 }).withMessage('Valid loan amount required'),
  body('bank_id').optional().isInt(),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'disbursed', 'closed'])
];

export const bankValidation = [
  body('name').notEmpty().withMessage('Bank name required'),
  body('code').optional().isString(),
  body('email').optional().isEmail()
];

export const brokerValidation = [
  body('name').notEmpty().withMessage('Broker name required'),
  body('commission_rate').optional().isFloat({ min: 0, max: 100 })
];

export const leadValidation = [
  body('customer_name').notEmpty().withMessage('Customer name required'),
  body('phone').notEmpty().withMessage('Phone number required'),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'converted', 'lost'])
];
