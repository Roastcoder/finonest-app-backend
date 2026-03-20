CREATE TABLE IF NOT EXISTS bank_branches (
  id SERIAL PRIMARY KEY,
  bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  branch_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  geo_limit VARCHAR(50),
  product VARCHAR(255),
  sales_manager_name VARCHAR(255),
  sales_manager_mobile VARCHAR(20),
  area_sales_manager_name VARCHAR(255),
  area_sales_manager_mobile VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
