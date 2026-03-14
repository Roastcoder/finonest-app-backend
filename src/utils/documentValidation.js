// Valid document types that can be uploaded
export const VALID_DOCUMENT_TYPES = {
  // Customer Documents
  'aadhar_front': 'Aadhar Card Front',
  'aadhar_back': 'Aadhar Card Back',
  'aadhaar_front': 'Aadhaar Card Front',
  'aadhaar_back': 'Aadhaar Card Back',
  'pan_card': 'PAN Card',
  'pan': 'PAN Card',
  'rc_front': 'RC Front',
  'rc_back': 'RC Back',
  'rc': 'RC',
  'driving_licence': 'Driving Licence',
  'driving_license': 'Driving License',
  'light_bill': 'Light Bill',
  'bank_statement': 'Bank Statement',
  'loan_statement': 'Loan Statement',
  'cheque': 'Cheque',
  'income_proof': 'Income Proof',
  'rent_agreement': 'Rent Agreement',
  'customer_photo': 'Customer Photo',
  'disbursement_memo': 'Disbursement Memo',
  'insurance': 'Insurance',
  'customer_ledger': 'Customer Ledger',
  
  // Co-applicant Documents
  'co_aadhar_front': 'Co-Applicant Aadhar Front',
  'co_aadhar_back': 'Co-Applicant Aadhar Back',
  'co_pan_card': 'Co-Applicant PAN Card',
  'co_photo': 'Co-Applicant Photo',
  
  // Guarantor Documents
  'guarantor_aadhar_front': 'Guarantor Aadhar Front',
  'guarantor_aadhar_back': 'Guarantor Aadhar Back',
  'guarantor_pan_card': 'Guarantor PAN Card',
  'guarantor_rc_front': 'Guarantor RC Front',
  'guarantor_rc_back': 'Guarantor RC Back',
  'guarantor_photo': 'Guarantor Photo'
};

// Normalize document type to standard format
export const normalizeDocumentType = (docType) => {
  if (!docType) return null;
  
  const normalized = docType.toLowerCase().trim();
  
  // Map variations to standard names
  const typeMap = {
    'aadhaar_front': 'aadhar_front',
    'aadhaar_back': 'aadhar_back',
    'aadhaar': 'aadhar_front',
    'aadhar': 'aadhar_front',
    'driving_license': 'driving_licence',
    'rc': 'rc_front'
  };
  
  return typeMap[normalized] || normalized;
};

// Validate document type
export const isValidDocumentType = (docType) => {
  const normalized = normalizeDocumentType(docType);
  return normalized && VALID_DOCUMENT_TYPES.hasOwnProperty(normalized);
};

// Get document label
export const getDocumentLabel = (docType) => {
  const normalized = normalizeDocumentType(docType);
  return VALID_DOCUMENT_TYPES[normalized] || docType;
};

// Validate file
export const validateDocumentFile = (file) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}. Only JPG, PNG, and PDF allowed.` };
  }
  
  return { valid: true };
};
