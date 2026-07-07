import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if(!user) return;
  const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [user.id]);
  if(!result.rows.length) return res.status(401).json({ error: 'Not authenticated' });
  res.status(200).json({ user: result.rows[0] });
}
