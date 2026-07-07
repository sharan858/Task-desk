import bcrypt from 'bcryptjs';
import { query } from '../_db.js';
import { signToken, setSessionCookie } from '../_auth.js';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password } = req.body || {};
  if(!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if(!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });
  if(!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if(existing.rows.length){
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
    [name.trim(), normalizedEmail, passwordHash]
  );
  const user = result.rows[0];
  setSessionCookie(res, signToken(user));
  res.status(201).json({ user });
}
