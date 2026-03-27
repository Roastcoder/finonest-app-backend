-- RC Data Inspection Queries
-- Use these queries to inspect RC data stored in the database

-- ============================================================================
-- 1. VIEW ALL CACHED RCs
-- ============================================================================

-- List all RCs in cache with basic info
SELECT 
  rc_number,
  api_type,
  created_at,
  jsonb_array_length(rc_data) as field_count
FROM rc_cache
ORDER BY created_at DESC;

-- ============================================================================
-- 2. VIEW SPECIFIC RC DATA
-- ============================================================================

-- Get complete RC data for a specific vehicle
SELECT 
  rc_number,
  rc_data,
  challan_data,
  api_type,
  created_at
FROM rc_cache
WHERE rc_number = 'RJ14UK0001';

-- Pretty print RC data
SELECT 
  rc_number,
  jsonb_pretty(rc_data) as rc_details,
  jsonb_pretty(challan_data) as challan_details,
  api_type,
  created_at
FROM rc_cache
WHERE rc_number = 'RJ14UK0001';

-- ============================================================================
-- 3. EXTRACT SPECIFIC FIELDS
-- ============================================================================

-- Extract key vehicle information
SELECT 
  rc_number,
  rc_data->>'vehicle_engine_number' as engine_number,
  rc_data->>'vehicle_chasi_number' as chassis_number,
  rc_data->>'owner_name' as owner_name,
  rc_data->>'maker_description' as maker,
  rc_data->>'maker_model' as model,
  rc_data->>'fuel_type' as fuel_type,
  rc_data->>'manufacturing_date' as mfg_date,
  rc_data->>'financed' as financed,
  rc_data->>'insurance_upto' as insurance_valid_upto,
  rc_data->>'pucc_upto' as pucc_valid_upto
FROM rc_cache
WHERE rc_number = 'RJ14UK0001';

-- Extract address information
SELECT 
  rc_number,
  rc_data->>'permanent_address' as address,
  rc_data->>'permanent_district' as district,
  rc_data->>'permanent_state' as state,
  rc_data->>'permanent_pincode' as pincode
FROM rc_cache
WHERE rc_number = 'RJ14UK0001';

-- Extract finance information
SELECT 
  rc_number,
  rc_data->>'financer' as financer,
  rc_data->>'financed' as financed,
  rc_data->>'finance_status' as finance_status,
  rc_data->>'owner_number' as owner_number
FROM rc_cache
WHERE rc_number = 'RJ14UK0001';

-- ============================================================================
-- 4. FIND MISSING OR NULL FIELDS
-- ============================================================================

-- Find RCs with missing engine numbers
SELECT 
  rc_number,
  api_type,
  created_at
FROM rc_cache
WHERE rc_data->>'vehicle_engine_number' IS NULL 
   OR rc_data->>'vehicle_engine_number' = '';

-- Find RCs with missing chassis numbers
SELECT 
  rc_number,
  api_type,
  created_at
FROM rc_cache
WHERE rc_data->>'vehicle_chasi_number' IS NULL 
   OR rc_data->>'vehicle_chasi_number' = '';

-- Find RCs with missing owner names
SELECT 
  rc_number,
  api_type,
  created_at
FROM rc_cache
WHERE rc_data->>'owner_name' IS NULL 
   OR rc_data->>'owner_name' = '';

-- ============================================================================
-- 5. STATISTICS AND ANALYSIS
-- ============================================================================

-- Count RCs by API type
SELECT 
  api_type,
  COUNT(*) as count,
  MAX(created_at) as latest_fetch
FROM rc_cache
GROUP BY api_type;

-- Find most recently fetched RCs
SELECT 
  rc_number,
  api_type,
  created_at,
  EXTRACT(DAY FROM NOW() - created_at) as days_ago
FROM rc_cache
ORDER BY created_at DESC
LIMIT 20;

-- Find RCs fetched today
SELECT 
  rc_number,
  api_type,
  created_at
FROM rc_cache
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Count financed vs non-financed vehicles
SELECT 
  rc_data->>'financed' as financed,
  COUNT(*) as count
FROM rc_cache
GROUP BY rc_data->>'financed';

-- ============================================================================
-- 6. DATA QUALITY CHECKS
-- ============================================================================

-- Find RCs with incomplete data (missing key fields)
SELECT 
  rc_number,
  api_type,
  CASE 
    WHEN rc_data->>'vehicle_engine_number' IS NULL THEN 'Missing engine_number'
    WHEN rc_data->>'vehicle_chasi_number' IS NULL THEN 'Missing chassis_number'
    WHEN rc_data->>'owner_name' IS NULL THEN 'Missing owner_name'
    WHEN rc_data->>'maker_description' IS NULL THEN 'Missing maker_description'
    WHEN rc_data->>'maker_model' IS NULL THEN 'Missing maker_model'
    ELSE 'Complete'
  END as data_status
FROM rc_cache
WHERE rc_data->>'vehicle_engine_number' IS NULL
   OR rc_data->>'vehicle_chasi_number' IS NULL
   OR rc_data->>'owner_name' IS NULL
   OR rc_data->>'maker_description' IS NULL
   OR rc_data->>'maker_model' IS NULL;

-- Check data size of each RC
SELECT 
  rc_number,
  api_type,
  pg_size_pretty(octet_length(rc_data::text)) as data_size,
  jsonb_array_length(rc_data) as field_count
FROM rc_cache
ORDER BY octet_length(rc_data::text) DESC;

-- ============================================================================
-- 7. SEARCH AND FILTER
-- ============================================================================

-- Search RCs by owner name
SELECT 
  rc_number,
  rc_data->>'owner_name' as owner_name,
  rc_data->>'maker_model' as model,
  api_type,
  created_at
FROM rc_cache
WHERE rc_data->>'owner_name' ILIKE '%RISHI%';

-- Search RCs by vehicle model
SELECT 
  rc_number,
  rc_data->>'maker_model' as model,
  rc_data->>'owner_name' as owner_name,
  api_type,
  created_at
FROM rc_cache
WHERE rc_data->>'maker_model' ILIKE '%FORTUNER%';

-- Search RCs by state
SELECT 
  rc_number,
  rc_data->>'permanent_state' as state,
  rc_data->>'permanent_district' as district,
  api_type,
  created_at
FROM rc_cache
WHERE rc_data->>'permanent_state' = 'Rajasthan';

-- ============================================================================
-- 8. COMPARE DATA BETWEEN FETCHES
-- ============================================================================

-- Find duplicate RCs (should only have one per rc_number due to UNIQUE constraint)
SELECT 
  rc_number,
  COUNT(*) as count
FROM rc_cache
GROUP BY rc_number
HAVING COUNT(*) > 1;

-- ============================================================================
-- 9. MAINTENANCE QUERIES
-- ============================================================================

-- Delete old RC cache entries (older than 90 days)
-- WARNING: This will delete data!
-- DELETE FROM rc_cache WHERE created_at < NOW() - INTERVAL '90 days';

-- Update an RC entry
-- UPDATE rc_cache 
-- SET rc_data = jsonb_set(rc_data, '{owner_name}', '"NEW NAME"')
-- WHERE rc_number = 'RJ14UK0001';

-- Clear all RC cache
-- WARNING: This will delete all data!
-- DELETE FROM rc_cache;

-- ============================================================================
-- 10. EXPORT DATA
-- ============================================================================

-- Export all RCs as CSV
COPY (
  SELECT 
    rc_number,
    rc_data->>'owner_name' as owner_name,
    rc_data->>'maker_model' as model,
    rc_data->>'fuel_type' as fuel_type,
    rc_data->>'manufacturing_date' as mfg_date,
    api_type,
    created_at
  FROM rc_cache
  ORDER BY created_at DESC
) TO '/tmp/rc_cache_export.csv' WITH CSV HEADER;

-- ============================================================================
-- 11. USEFUL VIEWS (Create these for easier access)
-- ============================================================================

-- Create a view for quick RC lookup
CREATE OR REPLACE VIEW rc_cache_summary AS
SELECT 
  rc_number,
  rc_data->>'owner_name' as owner_name,
  rc_data->>'maker_description' as maker,
  rc_data->>'maker_model' as model,
  rc_data->>'fuel_type' as fuel_type,
  rc_data->>'vehicle_engine_number' as engine_number,
  rc_data->>'vehicle_chasi_number' as chassis_number,
  rc_data->>'financed' as financed,
  rc_data->>'insurance_upto' as insurance_valid_upto,
  api_type,
  created_at
FROM rc_cache;

-- Use the view
SELECT * FROM rc_cache_summary WHERE rc_number = 'RJ14UK0001';

-- ============================================================================
-- 12. DEBUGGING QUERIES
-- ============================================================================

-- Check if a specific RC exists
SELECT EXISTS(SELECT 1 FROM rc_cache WHERE rc_number = 'RJ14UK0001') as rc_exists;

-- Get RC count
SELECT COUNT(*) as total_rcs FROM rc_cache;

-- Get database size
SELECT 
  pg_size_pretty(pg_total_relation_size('rc_cache')) as table_size;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'rc_cache'
ORDER BY ordinal_position;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. JSONB Operators:
--    ->  : Get JSON object field by key (returns jsonb)
--    ->> : Get JSON object field by key (returns text)
--    #>  : Get JSON object at specified path (returns jsonb)
--    #>> : Get JSON object at specified path (returns text)
--
-- 2. Common JSONB Functions:
--    jsonb_pretty()      : Pretty print JSON
--    jsonb_array_length(): Get array length
--    jsonb_each()        : Expand JSON object to key-value pairs
--    jsonb_keys()        : Get all keys from JSON object
--
-- 3. Performance Tips:
--    - Add index on rc_number for faster lookups
--    - Use ->> for text comparisons (faster than ->)
--    - Use ILIKE for case-insensitive searches
--
-- 4. Useful Indexes:
--    CREATE INDEX idx_rc_number ON rc_cache(rc_number);
--    CREATE INDEX idx_created_at ON rc_cache(created_at);
--    CREATE INDEX idx_api_type ON rc_cache(api_type);
--
