import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const result = await query('SELECT id, name, email FROM users ORDER BY name ASC');
  res.status(200).json({ users: result.rows });
}
