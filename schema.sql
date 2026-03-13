-- Drop all existing tables
DROP TABLE IF EXISTS lead_tags CASCADE;
DROP TABLE IF EXISTS lead_stage_history CASCADE;
DROP TABLE IF EXISTS customer_portal_access CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS insurance_policies CASCADE;
DROP TABLE IF EXISTS bank_statements CASCADE;
DROP TABLE IF EXISTS rc_ledger_entries CASCADE;
DROP TABLE IF EXISTS rc_folio_accounts CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payout_ledger CASCADE;
DROP TABLE IF EXISTS payout_config CASCADE;
DROP TABLE IF EXISTS financier_rates CASCADE;
DROP TABLE IF EXISTS financier_locations CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with hierarchy
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'executive',
  reporting_to INT,
  branch_id INT,
  dsa_id INT,
  joining_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporting_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create banks table
CREATE TABLE banks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create brokers table
CREATE TABLE brokers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  commission_rate DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create branches table
CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  manager_id INT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create leads table
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  current_address TEXT,
  pincode VARCHAR(10),
  city VARCHAR(100),
  state VARCHAR(100),
  pan_number VARCHAR(10),
  vehicle_number VARCHAR(20),
  loan_amount_required DECIMAL(15,2),
  case_type VARCHAR(20),
  lead_type VARCHAR(20),
  financier_id INT,
  stage VARCHAR(50) DEFAULT 'lead',
  otp_verified BOOLEAN DEFAULT FALSE,
  assigned_to INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (financier_id) REFERENCES banks(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create loans table
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  lead_id INT,
  loan_number VARCHAR(100) UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  loan_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  tenure INT,
  bank_id INT,
  broker_id INT,
  status VARCHAR(50) DEFAULT 'pending',
  disbursement_date DATE,
  pdd DATE,
  assigned_to INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create commissions table
CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  loan_id INT NOT NULL,
  broker_id INT,
  amount DECIMAL(15,2) NOT NULL,
  percentage DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL
);

-- Create documents table
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  uploaded_by INT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create financier_locations table
CREATE TABLE financier_locations (
  id SERIAL PRIMARY KEY,
  bank_id INT NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  geo_limit VARCHAR(255),
  banker_name VARCHAR(255),
  banker_mobile VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- Create financier_rates table
CREATE TABLE financier_rates (
  id SERIAL PRIMARY KEY,
  bank_id INT NOT NULL,
  case_type VARCHAR(20) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  processing_fee DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- Create payout_config table
CREATE TABLE payout_config (
  id SERIAL PRIMARY KEY,
  dsa_id INT NOT NULL,
  bank_id INT NOT NULL,
  payout_percentage DECIMAL(5,2) NOT NULL,
  payout_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
  UNIQUE (dsa_id, bank_id)
);

-- Create payout_ledger table
CREATE TABLE payout_ledger (
  id SERIAL PRIMARY KEY,
  loan_id INT NOT NULL,
  dsa_id INT NOT NULL,
  disbursed_amount DECIMAL(15,2) NOT NULL,
  payout_percentage DECIMAL(5,2) NOT NULL,
  payout_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  utr_reference VARCHAR(100),
  clawback_flag BOOLEAN DEFAULT FALSE,
  payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create expenses table
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  expense_type VARCHAR(50) NOT NULL,
  employee_id INT NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  document_path VARCHAR(500),
  expense_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INT,
  approval_date DATE,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create rc_folio_accounts table
CREATE TABLE rc_folio_accounts (
  id SERIAL PRIMARY KEY,
  loan_id INT NOT NULL,
  dsa_id INT NOT NULL,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (dsa_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create rc_ledger_entries table
CREATE TABLE rc_ledger_entries (
  id SERIAL PRIMARY KEY,
  folio_id INT NOT NULL,
  entry_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  utr_number VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INT,
  approval_date DATE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folio_id) REFERENCES rc_folio_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create bank_statements table
CREATE TABLE bank_statements (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by INT NOT NULL,
  total_entries INT DEFAULT 0,
  mapped_entries INT DEFAULT 0,
  suspense_entries INT DEFAULT 0,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create insurance_policies table
CREATE TABLE insurance_policies (
  id SERIAL PRIMARY KEY,
  loan_id INT NOT NULL,
  insurance_company VARCHAR(255) NOT NULL,
  policy_type VARCHAR(50) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  premium DECIMAL(10,2) NOT NULL,
  policy_start_date DATE NOT NULL,
  policy_expiry_date DATE NOT NULL,
  idv DECIMAL(15,2),
  ncb_applicable BOOLEAN DEFAULT FALSE,
  ncb_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);

-- Create notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id INT,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  delivery_channels JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created_at ON notifications(created_at);

-- Create system_config table
CREATE TABLE system_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(50) NOT NULL,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create customer_portal_access table
CREATE TABLE customer_portal_access (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  otp VARCHAR(6),
  otp_expiry TIMESTAMP,
  access_token VARCHAR(255),
  token_expiry TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE INDEX idx_portal_phone ON customer_portal_access(customer_phone);
CREATE INDEX idx_portal_token ON customer_portal_access(access_token);

-- Create lead_stage_history table
CREATE TABLE lead_stage_history (
  id SERIAL PRIMARY KEY,
  lead_id INT NOT NULL,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create lead_tags table
CREATE TABLE lead_tags (
  id SERIAL PRIMARY KEY,
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

-- Insert default admin user (password: admin123)
INSERT INTO users (user_id, full_name, email, password, role) VALUES
('AD-0001', 'Admin User', 'admin@finonest.com', '$2a$10$rZ5YvqZ5YvqZ5YvqZ5YvqOqZ5YvqZ5YvqZ5YvqZ5YvqZ5YvqZ5Yvq', 'admin');
