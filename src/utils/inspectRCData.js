/**
 * RC Database Inspector
 * Utility to inspect and debug RC data stored in the database
 * 
 * Usage: node src/utils/inspectRCData.js <rc_number>
 * Example: node src/utils/inspectRCData.js RJ14UK0001
 */

import db from '../config/database.js';

const inspectRCData = async (rcNumber) => {
  try {
    console.log('\n📋 RC DATA INSPECTOR');
    console.log('='.repeat(80));
    
    if (!rcNumber) {
      console.log('❌ Please provide an RC number');
      console.log('Usage: node src/utils/inspectRCData.js <rc_number>');
      process.exit(1);
    }

    const rcNumberUpper = rcNumber.toUpperCase();
    console.log(`\n🔍 Searching for RC: ${rcNumberUpper}\n`);

    // Query the database
    const result = await db.query(
      'SELECT id, rc_number, rc_data, challan_data, api_type, created_at FROM rc_cache WHERE rc_number = $1',
      [rcNumberUpper]
    );

    if (result.rows.length === 0) {
      console.log(`❌ RC ${rcNumberUpper} not found in database\n`);
      
      // Show all RCs in cache
      const allRCs = await db.query('SELECT rc_number, api_type, created_at FROM rc_cache ORDER BY created_at DESC LIMIT 10');
      if (allRCs.rows.length > 0) {
        console.log('📦 Recent RCs in cache:');
        allRCs.rows.forEach((row, i) => {
          console.log(`  ${i + 1}. ${row.rc_number} (${row.api_type}) - ${row.created_at}`);
        });
      }
      process.exit(0);
    }

    const row = result.rows[0];
    const rcData = typeof row.rc_data === 'string' ? JSON.parse(row.rc_data) : row.rc_data;
    const challanData = typeof row.challan_data === 'string' ? JSON.parse(row.challan_data) : row.challan_data;

    console.log(`✅ Found RC in database\n`);
    console.log(`📌 Metadata:`);
    console.log(`   ID: ${row.id}`);
    console.log(`   RC Number: ${row.rc_number}`);
    console.log(`   API Type: ${row.api_type}`);
    console.log(`   Created At: ${row.created_at}`);
    console.log(`   Data Size: ${JSON.stringify(rcData).length} bytes\n`);

    console.log(`📊 RC Data Fields (${Object.keys(rcData).length} total):`);
    console.log('-'.repeat(80));
    
    const categories = {
      'Vehicle Identification': [
        'rc_number', 'vehicle_engine_number', 'vehicle_chasi_number', 'vehicle_category'
      ],
      'Owner Information': [
        'owner_name', 'owner_number', 'rc_owner_name'
      ],
      'Vehicle Details': [
        'maker_description', 'maker_model', 'body_type', 'color', 'fuel_type', 'model_variant_name'
      ],
      'Capacity & Weight': [
        'cubic_capacity', 'no_cylinders', 'seat_capacity', 'vehicle_gross_weight', 'unladen_weight', 'wheelbase'
      ],
      'Dates': [
        'manufacturing_date', 'manufacturing_date_formatted', 'registration_date', 'tax_paid_upto', 'fit_up_to', 'latest_by'
      ],
      'Insurance & Compliance': [
        'insurance_company', 'insurance_upto', 'pucc_number', 'pucc_upto', 'norms_type'
      ],
      'Finance Information': [
        'financer', 'financed', 'finance_status'
      ],
      'Address Information': [
        'permanent_address', 'present_address', 'permanent_district', 'permanent_state', 'permanent_pincode',
        'current_district', 'current_state', 'current_pincode'
      ],
      'Permits & Documents': [
        'national_permit_number', 'permit_number', 'permit_type', 'noc_details'
      ],
      'Status & Other': [
        'rc_status', 'blacklist_status', 'non_use_status', 'registered_at', 'rto_code'
      ]
    };

    for (const [category, fields] of Object.entries(categories)) {
      const categoryData = fields.filter(f => rcData[f] !== undefined && rcData[f] !== null && rcData[f] !== '');
      if (categoryData.length > 0) {
        console.log(`\n🏷️  ${category}:`);
        categoryData.forEach(field => {
          const value = rcData[field];
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 60);
          console.log(`   ✓ ${field}: ${displayValue}`);
        });
      }
    }

    // Show fields that are empty or missing
    const allFields = Object.keys(rcData);
    const emptyFields = allFields.filter(f => !rcData[f] || rcData[f] === '' || rcData[f] === null);
    
    if (emptyFields.length > 0) {
      console.log(`\n⚠️  Empty/Missing Fields (${emptyFields.length}):`);
      emptyFields.slice(0, 10).forEach(field => {
        console.log(`   - ${field}`);
      });
      if (emptyFields.length > 10) {
        console.log(`   ... and ${emptyFields.length - 10} more`);
      }
    }

    console.log(`\n📋 Challan Information:`);
    console.log(`   Status: ${challanData.status}`);
    console.log(`   Count: ${challanData.count}`);
    if (challanData.challans && challanData.challans.length > 0) {
      console.log(`   Challans: ${challanData.challans.length}`);
    }

    console.log(`\n📄 Full RC Data (JSON):`);
    console.log('-'.repeat(80));
    console.log(JSON.stringify(rcData, null, 2));

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Get RC number from command line arguments
const rcNumber = process.argv[2];
inspectRCData(rcNumber);
