import crypto from 'crypto';
import { query } from '../_db.js';
import { sendMail } from '../_mailer.js';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if(!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const genericResponse = { ok: true, message: 'If an account with that email exists, a reset link has been sent.' };

  const result = await query('SELECT id, name, email FROM users WHERE email = $1', [normalizedEmail]);
  const user = result.rows[0];
  if(!user){
    return res.status(200).json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [user.id, tokenHash, expiresAt]
  );

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const resetLink = `${appUrl}?resetToken=${rawToken}`;

  try{
    await sendMail({
      to: user.email,
      subject: 'Reset your TaskDesk password',
      html: `
        <p>Hi ${user.name},</p>
        <p>Someone requested a password reset for your TaskDesk account. Click the link below to choose a new password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Reset your TaskDesk password: ${resetLink} (expires in 1 hour)`
    });
  }catch(e){
    console.error('Failed to send password reset email:', e.message);
    return res.status(500).json({ error: 'Could not send reset email. Please try again later.' });
  }

  return res.status(200).json(genericResponse);
}
