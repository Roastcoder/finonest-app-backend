import db from './src/config/database.js';

const newBanks = [
  { name: 'HDFC Bank', code: 'HDFC' },
  { name: 'Axis Bank', code: 'AXIS' },
  { name: 'ICICI Bank', code: 'ICICI' },
  { name: 'Mahindra Finance', code: 'MF' },
  { name: 'Equitas Small Finance Bank', code: 'EQUITAS' },
  { name: 'Toyota Financial Services India Limited', code: 'TOYOTA' },
  { name: 'Kotak Mahindra Prime', code: 'KOTAK' },
  { name: 'Jana Bank', code: 'JANA' },
  { name: 'Federal Bank', code: 'FEDERAL' },
  { name: 'Tata Capital', code: 'TATA' },
  { name: 'Bandhan Bank', code: 'BANDHAN' },
  { name: 'Loans24', code: 'LOANS24' },
  { name: 'Saraswat Bank', code: 'SARASWAT' },
  { name: 'Muthoot Capital', code: 'MUTHOOT' },
  { name: 'Poonawalla Fincorp Limited', code: 'POONAWALLA' },
  { name: 'Suryoday Bank', code: 'SURYODAY' },
  { name: 'Indostar', code: 'INDOSTAR' },
  { name: 'ESAF Small Finance Bank', code: 'ESAF' },
  { name: 'Vastu Finserve', code: 'VASTU' },
  { name: 'HDB Financial Services', code: 'HDB' },
  { name: 'IDFC First Bank', code: 'IDFC' },
  { name: 'Cholamandalam Finance', code: 'CHOLA' },
  { name: 'Hero Fincorp', code: 'HERO' },
  { name: 'Bajaj Finserv Ltd', code: 'BAJAJ' },
  { name: 'Yes Bank', code: 'YES' },
  { name: 'TVS Credit Services', code: 'TVS' },
  { name: 'Fortune Finance', code: 'FORTUNE' },
  { name: 'Piramal', code: 'PIRAMAL' },
  { name: 'AU Small Finance Bank', code: 'AU' },
  { name: 'IndusInd Bank', code: 'INDUSIND' },
  { name: 'RBL Bank', code: 'RBL' },
  { name: 'Manappuram Finance Limited', code: 'MANAPPURAM' },
  { name: 'Nissan Renault Financial Services', code: 'NISSAN' },
  { name: 'IKF Finance', code: 'IKF' },
  { name: 'Kogta Financial India Limited', code: 'KOGTA' },
  { name: 'Sundram Finance', code: 'SUNDRAM' }
];

async function updateBanks() {
  try {
    console.log('Starting bank update...');
    
    // Delete all existing banks
    await db.query('DELETE FROM banks');
    console.log('✅ Deleted all existing banks');
    
    // Insert new banks
    for (const bank of newBanks) {
      await db.query(
        'INSERT INTO banks (name, code, status) VALUES ($1, $2, $3)',
        [bank.name, bank.code, 'active']
      );
    }
    console.log(`✅ Added ${newBanks.length} new banks`);
    
    // Verify
    const result = await db.query('SELECT COUNT(*) as count FROM banks');
    console.log(`✅ Total banks in database: ${result.rows[0].count}`);
    
    // List all banks
    const allBanks = await db.query('SELECT id, name, code FROM banks ORDER BY name');
    console.log('\n📋 All Banks:');
    allBanks.rows.forEach((bank, index) => {
      console.log(`${index + 1}. ${bank.name} (${bank.code})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating banks:', error);
    process.exit(1);
  }
}

updateBanks();
