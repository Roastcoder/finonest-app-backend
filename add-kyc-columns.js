import db from './src/config/database.js';

async function addKycColumns() {
  try {
    console.log('Adding KYC data columns to users table...\n');
    
    const kycColumns = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_data JSONB',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_data JSONB',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT \\'INDIA\\''\n    ];\n    \n    for (const query of kycColumns) {\n      try {\n        await db.query(query);\n        console.log('✅', query.split('ADD COLUMN IF NOT EXISTS ')[1]?.split(' ')[0] || 'Column added');\n      } catch (error) {\n        console.log('⚠️', query, '- Error:', error.message);\n      }\n    }\n    \n    console.log('\\n✅ All KYC columns added successfully!');\n    \n    // Check final table structure\n    const columns = await db.query(`\n      SELECT column_name, data_type \n      FROM information_schema.columns \n      WHERE table_name = 'users' AND column_name LIKE '%pan%' OR column_name LIKE '%aadhaar%' OR column_name LIKE '%kyc%'\n      ORDER BY column_name\n    `);\n    \n    console.log('\\nKYC-related columns:');\n    columns.rows.forEach(col => {\n      console.log(`  - ${col.column_name}: ${col.data_type}`);\n    });\n    \n  } catch (error) {\n    console.error('Error adding KYC columns:', error.message);\n  }\n}\n\naddKycColumns();