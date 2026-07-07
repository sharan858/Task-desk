// Local-only dev server that mounts the same /api handler files Vercel will run in production.
// Not deployed — Vercel serves the api/ folder natively via its own routing.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadDotEnv(){
  const envPath = path.join(root, '.env');
  if(!fs.existsSync(envPath)) return;
  for(const line of fs.readFileSync(envPath, 'utf8').split('\n')){
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

const app = express();
app.use(express.json());

async function mount(routePath, fileRelPath){
  const fileUrl = pathToFileURL(path.join(root, 'api', fileRelPath)).href;
  const mod = await import(fileUrl);
  const handler = mod.default;
  app.all(routePath, async (req, res) => {
    req.query = { ...req.query, ...req.params };
    try{
      await handler(req, res);
    }catch(e){
      console.error(e);
      if(!res.headersSent) res.status(500).json({ error: e.message });
    }
  });
}

await mount('/api/auth/register', 'auth/register.js');
await mount('/api/auth/login', 'auth/login.js');
await mount('/api/auth/logout', 'auth/logout.js');
await mount('/api/auth/me', 'auth/me.js');
await mount('/api/users', 'users/index.js');
await mount('/api/accounts', 'accounts/index.js');
await mount('/api/accounts/:id', 'accounts/[id].js');
await mount('/api/tasks', 'tasks/index.js');
await mount('/api/tasks/:id', 'tasks/[id].js');

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Dev API listening on http://localhost:${port}`));
