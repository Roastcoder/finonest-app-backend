-- Add new fields for loan login details (lender selection, sales manager, location)
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS selected_financier VARCHAR(255),
ADD COLUMN IF NOT EXISTS financier_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_manager VARCHAR(255),
ADD COLUMN IF NOT EXISTS current_landmark VARCHAR(255),
ADD COLUMN IF NOT EXISTS current_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS permanent_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS engine_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS chassis_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS maker_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS financer VARCHAR(255),
ADD COLUMN IF NOT EXISTS finance_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS insurance_company VARCHAR(255),
ADD COLUMN IF NOT EXISTS insurance_valid_upto DATE,
ADD COLUMN IF NOT EXISTS pucc_valid_upto DATE,
ADD COLUMN IF NOT EXISTS financier_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS maker_description VARCHAR(255);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_loans_selected_financier ON loans(selected_financier);
CREATE INDEX IF NOT EXISTS idx_loans_sales_manager ON loans(sales_manager);
CREATE INDEX IF NOT EXISTS idx_loans_financier_location ON loans(financier_location);
