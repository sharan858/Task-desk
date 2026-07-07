import bcrypt from 'bcryptjs';
import { query } from '../_db.js';
import { signToken, setSessionCookie } from '../_auth.js';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const result = await query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  const row = result.rows[0];
  if(!row) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, row.password_hash);
  if(!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const user = { id: row.id, name: row.name, email: row.email };
  setSessionCookie(res, signToken(user));
  res.status(200).json({ user });
}
