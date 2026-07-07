import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

const ROLES = ['csm', 'account_manager'];

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;

  if(req.method === 'PATCH'){
    const { role } = req.body || {};
    if(!ROLES.includes(role)) return res.status(400).json({ error: 'Role must be either CSM or Account Manager' });

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, user.id]
    );
    return res.status(200).json({ user: result.rows[0] });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
