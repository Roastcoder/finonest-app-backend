import bcrypt from 'bcryptjs';
import db from './src/config/database.js';

async function reset() {
    const hash = await bcrypt.hash('password123', 10);
    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@finonest.com']);
    console.log('Password reset to password123 for admin@finonest.com');
    process.exit(0);
}

reset();
