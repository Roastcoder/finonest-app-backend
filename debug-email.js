import db from './src/config/database.js';

async function debugEmailCheck() {
  try {
    const testEmail = `debug${Date.now()}@example.com`;
    console.log('Testing email:', testEmail);
    
    // Check if email exists
    const existingUser = await db.query('SELECT id, email FROM users WHERE email = $1', [testEmail]);
    console.log('Existing user check result:', existingUser.rows);
    console.log('Number of rows:', existingUser.rows.length);
    
    // Check all emails in database to see if there's a pattern
    const allEmails = await db.query('SELECT email FROM users ORDER BY email LIMIT 10');
    console.log('\nFirst 10 emails in database:');
    allEmails.rows.forEach(row => console.log('  -', row.email));
    
    // Test the exact email from the failed test
    const failedEmail = 'exectest1774259334596dt18c@example.com';
    const failedCheck = await db.query('SELECT id, email FROM users WHERE email = $1', [failedEmail]);
    console.log('\nChecking failed email:', failedEmail);
    console.log('Result:', failedCheck.rows);
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugEmailCheck();