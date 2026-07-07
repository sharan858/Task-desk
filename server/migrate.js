// One-off schema migration runner. Usage: npm run migrate
// Reads DATABASE_URL from .env (via a tiny manual loader, no dotenv dependency needed).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnv(){
  const envPath = path.join(__dirname, '..', '.env');
  if(!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for(const line of lines){
    const trimmed = line.trim();
    if(!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if(idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))){
      value = value.slice(1, -1);
    }
    if(!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if(!connectionString){
  console.error('Missing DATABASE_URL (or POSTGRES_URL) — set it in .env or your shell environment.');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try{
  await client.connect();
  await client.query(sql);
  console.log('Schema applied successfully.');
}catch(err){
  console.error('Migration failed:', err.message);
  process.exit(1);
}finally{
  await client.end();
}
