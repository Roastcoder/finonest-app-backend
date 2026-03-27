#!/usr/bin/env node

/**
 * Debug script to check RC data for RJ14UK0040
 * Usage: node debug-rc-rj14uk0040.js
 */

import db from './src/config/database.js';

async function debugRC() {
  try {
    console.log('\n🔍 Checking RC data for RJ14UK0040...\n');

    const result = await db.query(
      'SELECT rc_data FROM rc_cache WHERE rc_number = $1',
      ['RJ14UK0040']
    );

    if (result.rows.length === 0) {
      console.log('❌ RC RJ14UK0040 not found in cache');
      console.log('\nAvailable RCs:');
      const allRCs = await db.query('SELECT rc_number FROM rc_cache LIMIT 5');
      allRCs.rows.forEach(row => console.log(`  - ${row.rc_number}`));
      process.exit(0);
    }

    const rcData = typeof result.rows[0].rc_data === 'string' 
      ? JSON.parse(result.rows[0].rc_data) 
      : result.rows[0].rc_data;

    console.log('✅ RC data found!\n');
    console.log('📋 All fields in RC data:');
    console.log('-'.repeat(80));

    const fields = Object.keys(rcData).sort();
    fields.forEach(field => {
      const value = rcData[field];
      if (value && value !== '' && value !== null) {
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value).substring(0, 60)
          : String(value).substring(0, 60);
        console.log(`✓ ${field}: ${displayValue}`);
      }
    });

    console.log('\n🏠 Address-related fields:');
    console.log('-'.repeat(80));
    const addressFields = fields.filter(f => 
      f.toLowerCase().includes('address') || 
      f.toLowerCase().includes('location') ||
      f.toLowerCase().includes('place')
    );
    
    if (addressFields.length === 0) {
      console.log('❌ No address fields found');
    } else {
      addressFields.forEach(field => {
        console.log(`${field}: ${rcData[field]}`);
      });
    }

    console.log('\n👤 Owner-related fields:');
    console.log('-'.repeat(80));
    const ownerFields = fields.filter(f => 
      f.toLowerCase().includes('owner') || 
      f.toLowerCase().includes('name')
    );
    
    ownerFields.forEach(field => {
      console.log(`${field}: ${rcData[field]}`);
    });

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugRC();
