import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const client = new Client({
  host: '72.61.238.231',
  port: 3000,
  database: 'board',
  user: 'Board',
  password: 'Sanam@28'
});

async function createAdmin() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Check existing user
    const check = await client.query('SELECT * FROM users WHERE email = $1', ['admin@finonest.com']);
    if (check.rows.length > 0) {
      console.log('Existing user found, testing password...');
      const isValid = await bcrypt.compare('admin@123', check.rows[0].password);
      console.log('Password valid:', isValid);
    }

    const hashedPassword = await bcrypt.hash('admin@123', 10);
    console.log('New hash:', hashedPassword);
    
    await client.query(
      'DELETE FROM users WHERE email = $1',
      ['admin@finonest.com']
    );
    
    await client.query(
      'INSERT INTO users (name, email, password, role, joining_date) VALUES ($1, $2, $3, $4, $5)',
      ['Admin User', 'admin@finonest.com', hashedPassword, 'admin', new Date()]
    );
    
    console.log('Admin account created successfully!');
    console.log('Email: admin@finonest.com');
    console.log('Password: admin@123');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createAdmin();
