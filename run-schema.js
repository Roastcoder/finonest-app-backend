import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

const client = new Client({
  host: '72.61.238.231',
  port: 3000,
  database: 'board',
  user: 'Board',
  password: 'Sanam@28'
});

async function runSchema() {
  try {
    await client.connect();
    console.log('Connected to database');

    const schema = fs.readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    
    console.log('Schema executed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

runSchema();
