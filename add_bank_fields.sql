-- Add new fields to banks table
ALTER TABLE banks 
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS geo_limit VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_manager_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_manager_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS area_sales_manager_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS area_sales_manager_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS product TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment
COMMENT ON COLUMN banks.location IS 'Bank branch location';
COMMENT ON COLUMN banks.geo_limit IS 'Geographical limit for operations';
COMMENT ON COLUMN banks.sales_manager_name IS 'Sales manager name';
COMMENT ON COLUMN banks.sales_manager_mobile IS 'Sales manager mobile number';
COMMENT ON COLUMN banks.area_sales_manager_name IS 'Area sales manager name';
COMMENT ON COLUMN banks.area_sales_manager_mobile IS 'Area sales manager mobile number';
COMMENT ON COLUMN banks.product IS 'Bank products offered';
COMMENT ON COLUMN banks.logo_url IS 'Bank logo image URL';
