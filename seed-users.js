import bcrypt from 'bcryptjs';
import db from './src/config/database.js';

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');

    const users = [
      { user_id: 'AD-0001', name: 'Admin User', email: 'admin@finonest.com', password: 'admin123', role: 'admin' },
      { user_id: 'MG-0001', name: 'Manager User', email: 'manager@finonest.com', password: 'manager123', role: 'manager' },
      { user_id: 'DS-0001', name: 'DSA User', email: 'dsa@finonest.com', password: 'dsa123', role: 'dsa' },
      { user_id: 'TL-0001', name: 'Team Leader', email: 'teamlead@finonest.com', password: 'team123', role: 'team_leader' },
      { user_id: 'EX-0001', name: 'Executive User', email: 'executive@finonest.com', password: 'exec123', role: 'executive' },
      { user_id: 'OP-0001', name: 'Ops Team', email: 'ops@finonest.com', password: 'ops123', role: 'ops_team' }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(
        `INSERT INTO users (user_id, full_name, email, password, role, status) 
         VALUES ($1, $2, $3, $4, $5, 'active') 
         ON CONFLICT (email) DO NOTHING`,
        [user.user_id, user.name, user.email, hashedPassword, user.role]
      );
      console.log(`✅ Created: ${user.email} / ${user.password}`);
    }

    console.log('\n✅ All users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();
