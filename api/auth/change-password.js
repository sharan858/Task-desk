import bcrypt from 'bcryptjs';
import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = requireAuth(req, res);
  if(!user) return;

  const { currentPassword, newPassword } = req.body || {};
  if(!currentPassword) return res.status(400).json({ error: 'Current password is required' });
  if(!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

  const result = await query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  const row = result.rows[0];
  if(!row) return res.status(401).json({ error: 'Not authenticated' });

  const ok = await bcrypt.compare(currentPassword, row.password_hash);
  if(!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);
  res.status(200).json({ ok: true });
}
