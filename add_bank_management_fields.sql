-- Add new columns to banks table for enhanced bank management
ALTER TABLE banks 
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS geo_limit INTEGER,
ADD COLUMN IF NOT EXISTS sales_manager_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_manager_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS area_sales_manager_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS area_sales_manager_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS product VARCHAR(255),
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Update existing records to have default status if null
UPDATE banks SET status = 'active' WHERE status IS NULL;