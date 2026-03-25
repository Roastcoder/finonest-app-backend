import bcrypt from 'bcryptjs';
import db from './config/database.js';

const seedData = async () => {
  try {
    console.log('🌱 Seeding database...');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@carcredithub.com', hashedPassword, 'admin']
    );

    const banks = [
      ['HDFC Bank', 'HDFC', 'loans@hdfc.com', '1800-123-4567'],
      ['ICICI Bank', 'ICICI', 'loans@icici.com', '1800-234-5678'],
      ['SBI', 'SBI', 'loans@sbi.com', '1800-345-6789'],
      ['Axis Bank', 'AXIS', 'loans@axis.com', '1800-456-7890']
    ];

    for (const bank of banks) {
      await db.query(
        `INSERT INTO banks (name, code, email, phone) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (code) DO NOTHING`,
        bank
      );
    }

    const brokers = [
      ['Quick Finance', 'QF001', 2.5, '9876543210'],
      ['Fast Loans', 'FL001', 3.0, '9876543211'],
      ['Easy Credit', 'EC001', 2.0, '9876543212']
    ];

    for (const broker of brokers) {
      await db.query(
        `INSERT INTO brokers (name, code, commission_rate, phone) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (code) DO NOTHING`,
        broker
      );
    }

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
