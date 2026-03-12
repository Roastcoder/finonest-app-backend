-- Add new vehicle fields to loans table
ALTER TABLE loans 
  ADD COLUMN IF NOT EXISTS engine_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS chassis_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS maker_description TEXT,
  ADD COLUMN IF NOT EXISTS maker_model VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS insurance_company VARCHAR(255),
  ADD COLUMN IF NOT EXISTS insurance_valid_upto DATE,
  ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
  ADD COLUMN IF NOT EXISTS pucc_valid_upto DATE,
  ADD COLUMN IF NOT EXISTS financer VARCHAR(255),
  ADD COLUMN IF NOT EXISTS finance_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50);
