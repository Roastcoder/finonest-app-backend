CREATE DATABASE IF NOT EXISTS car_credit_hub;
USE car_credit_hub;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'sales', 'accountant') DEFAULT 'sales',
  phone VARCHAR(20),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE banks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE brokers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  commission_rate DECIMAL(5,2) DEFAULT 0,
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  loan_amount DECIMAL(15,2) NOT NULL,
  bank_id INT,
  broker_id INT,
  user_id INT,
  status ENUM('pending', 'approved', 'rejected', 'disbursed', 'closed') DEFAULT 'pending',
  application_date DATE,
  approval_date DATE,
  disbursement_date DATE,
  vehicle_model VARCHAR(255),
  vehicle_price DECIMAL(15,2),
  down_payment DECIMAL(15,2),
  tenure_months INT,
  interest_rate DECIMAL(5,2),
  emi_amount DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  source VARCHAR(100),
  status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
  assigned_to INT,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE commissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  broker_id INT,
  user_id INT,
  amount DECIMAL(15,2) NOT NULL,
  commission_type ENUM('broker', 'sales', 'referral') NOT NULL,
  status ENUM('pending', 'approved', 'paid') DEFAULT 'pending',
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (broker_id) REFERENCES brokers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE pdd_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  status ENUM('pending', 'received', 'verified', 'rejected') DEFAULT 'pending',
  received_date DATE,
  verified_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@carcredithub.com', '$2a$10$rZ5YqZ5YqZ5YqZ5YqZ5YqOqZ5YqZ5YqZ5YqZ5YqZ5YqZ5YqZ5YqZ5', 'admin');
