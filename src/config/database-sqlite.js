import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Create database directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'car_credit_hub.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('✅ SQLite database connected:', dbPath);

// Wrapper to make it compatible with pg interface
const sqliteWrapper = {
  query: (sql, params = []) => {
    try {
      if (sql.trim().toLowerCase().startsWith('select')) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(params);
        return Promise.resolve({ rows, rowCount: rows.length });
      } else {
        const stmt = db.prepare(sql);
        const result = stmt.run(params);
        return Promise.resolve({ 
          rows: result.lastInsertRowid ? [{ id: result.lastInsertRowid }] : [], 
          rowCount: result.changes 
        });
      }
    } catch (error) {
      return Promise.reject(error);
    }
  },
  connect: (callback) => {
    if (callback) callback(null, sqliteWrapper, () => {});
    return Promise.resolve(sqliteWrapper);
  },
  on: () => {},
  end: () => db.close()
};

export default sqliteWrapper;