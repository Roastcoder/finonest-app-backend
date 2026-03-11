-- Schema updates to match PRD requirements
USE car_credit_hub;

-- 1. Update users table for 6-level hierarchy
ALTER TABLE users 
  MODIFY COLUMN role ENUM('admin', 'ops_team', 'sales_manager', 'dsa', 'team_leader', 'executive') DEFAULT 'executive',
  ADD COLUMN reporting_to INT,
  ADD COLUMN branch VARCHAR(255),
  ADD COLUMN joining_date DATE,
  ADD FOREIGN KEY (reporting_to) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Update leads table with all PRD fields
ALTER TABLE leads
  ADD COLUMN current_address TEXT,
  ADD COLUMN pincode VARCHAR(10),
  ADD COLUMN city VARCHAR(100),
  ADD COLUMN state VARCHAR(100),
  ADD COLUMN pan_number VARCHAR(10),
  ADD COLUMN vehicle_number VARCHAR(20),
  ADD COLUMN loan_amount_required DECIMAL(15,2),
  ADD COLUMN case_type ENUM('purchase', 'refinance', 'bt'),
  ADD COLUMN lead_type ENUM('branch_visit', 'direct_login'),
  ADD COLUMN financier_id INT,
  ADD COLUMN stage ENUM('lead', 'login', 'approved', 'abnd', 'disbursed', 'rejected') DEFAULT 'lead',
  ADD COLUMN otp_verified BOOLEAN DEFAULT FALSE,
  ADD FOREIGN KEY (financier_id) REFERENCES banks(id) ON DELETE SET NULL;

-- 3. Document uploads table
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  document_type ENUM('aadhaar_front', 'aadhaar_back', 'pan_card', 'rc_front', 'rc_back', 'loan_soa', 'bank_statement', 'income_proof') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  uploaded_by INT,
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Financier serviceable locations
CREATE TABLE financier_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bank_id INT NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  geo_limit VARCHAR(255),
  banker_name VARCHAR(255),
  banker_mobile VARCHAR(20),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- 5. Financier rates configuration
CREATE TABLE financier_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bank_id INT NOT NULL,
  case_type ENUM('purchase', 'refinance', 'bt') NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  processing_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- 6. DSA payout configuration
CREATE TABLE payout_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dsa_id INT NOT NULL,
  bank_id INT NOT NULL,
  payout_percentage DECIMAL(5,2) NOT NULL,
  payout_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dsa_bank (dsa_id, bank_id)
);

-- 7. Payout ledger
CREATE TABLE payout_ledger (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  dsa_id INT NOT NULL,
  disbursed_amount DECIMAL(15,2) NOT NULL,
  payout_percentage DECIMAL(5,2) NOT NULL,
  payout_amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending', 'processed', 'on_hold') DEFAULT 'pending',
  utr_reference VARCHAR(100),
  clawback_flag BOOLEAN DEFAULT FALSE,
  payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Expense management
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  expense_type ENUM('salary', 'rent', 'electricity', 'rto', 'travel', 'other') NOT NULL,
  employee_id INT NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  document_path VARCHAR(500),
  expense_date DATE NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approval_date DATE,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. RC Limit Module - Folio Accounts
CREATE TABLE rc_folio_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  dsa_id INT NOT NULL,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. RC Limit Ledger Entries
CREATE TABLE rc_ledger_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  folio_id INT NOT NULL,
  entry_type ENUM('payment_request', 'loan_closure', 'customer_payment', 'rto_payment', 'bank_deposit') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type ENUM('debit', 'credit') NOT NULL,
  utr_number VARCHAR(100),
  description TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approval_date DATE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folio_id) REFERENCES rc_folio_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Bank statement imports for RC module
CREATE TABLE bank_statements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by INT NOT NULL,
  total_entries INT DEFAULT 0,
  mapped_entries INT DEFAULT 0,
  suspense_entries INT DEFAULT 0,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Insurance policies
CREATE TABLE insurance_policies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  insurance_company VARCHAR(255) NOT NULL,
  policy_type ENUM('comprehensive', 'third_party') NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  premium DECIMAL(10,2) NOT NULL,
  policy_start_date DATE NOT NULL,
  policy_expiry_date DATE NOT NULL,
  idv DECIMAL(15,2),
  ncb_applicable BOOLEAN DEFAULT FALSE,
  ncb_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- 13. Audit log
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_role VARCHAR(50),
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100),
  record_id INT,
  before_value TEXT,
  after_value TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_table_record (table_name, record_id)
);

-- 14. Notifications
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  notification_type ENUM('lead_created', 'stage_change', 'disbursement', 'rejection', 'payment_request', 'expense_submission', 'pdd_overdue') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  delivery_channels JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created_at (created_at)
);

-- 15. System configuration
CREATE TABLE system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type ENUM('general', 'document', 'stage', 'integration') NOT NULL,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 16. Customer portal access
CREATE TABLE customer_portal_access (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6),
  otp_expiry TIMESTAMP,
  access_token VARCHAR(255),
  token_expiry TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_phone (customer_phone),
  INDEX idx_token (access_token)
);

-- 17. Lead stage history for tracking
CREATE TABLE lead_stage_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 18. Tags for leads
CREATE TABLE lead_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default system configurations
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('company_name', 'Finonest', 'general', 'Company name'),
('timezone', 'Asia/Kolkata', 'general', 'System timezone'),
('currency', 'INR', 'general', 'System currency'),
('session_timeout', '30', 'general', 'Session timeout in minutes'),
('max_file_size', '10485760', 'document', 'Max file upload size in bytes (10MB)'),
('allowed_file_types', 'jpg,jpeg,png,pdf', 'document', 'Allowed file extensions');
