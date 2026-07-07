import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

const FIELD_MAP = {
  name: 'name',
  description: 'description',
  health: 'health',
  ownerId: 'owner_id',
  accountManagerId: 'account_manager_id',
  pocName: 'poc_name',
  pocEmail: 'poc_email'
};

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;
  const { id } = req.query;

  if(req.method === 'GET'){
    const result = await query(`
      SELECT a.*, o.name AS owner_name, m.name AS account_manager_name
      FROM accounts a
      LEFT JOIN users o ON o.id = a.owner_id
      JOIN users m ON m.id = a.account_manager_id
      WHERE a.id = $1`, [id]);
    if(!result.rows.length) return res.status(404).json({ error: 'Account not found' });
    return res.status(200).json({ account: result.rows[0] });
  }

  if(req.method === 'PATCH'){
    const fields = req.body || {};
    if(fields.name !== undefined && !fields.name.trim()){
      return res.status(400).json({ error: 'Account name is required' });
    }
    if(fields.pocName !== undefined && !fields.pocName.trim()){
      return res.status(400).json({ error: 'POC name is required' });
    }
    if(fields.pocEmail !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.pocEmail.trim())){
      return res.status(400).json({ error: 'A valid POC email is required' });
    }
    const sets = []; const values = []; let i = 1;
    for(const key in FIELD_MAP){
      if(fields[key] !== undefined){
        sets.push(`${FIELD_MAP[key]} = $${i++}`);
        values.push(key === 'ownerId' ? (fields[key] || null) : fields[key]);
      }
    }
    if(!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push('updated_at = now()');
    values.push(id);

    try{
      const result = await query(`UPDATE accounts SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, values);
      if(!result.rows.length) return res.status(404).json({ error: 'Account not found' });
      return res.status(200).json({ account: result.rows[0] });
    }catch(e){
      if(e.code === '23505') return res.status(409).json({ error: 'An account with that name already exists' });
      throw e;
    }
  }

  if(req.method === 'DELETE'){
    const count = await query('SELECT COUNT(*) FROM tasks WHERE account_id = $1', [id]);
    const linked = Number(count.rows[0].count);
    if(linked > 0){
      return res.status(409).json({ error: `Can't remove this account — ${linked} task(s) are still linked to it.` });
    }
    await query('DELETE FROM accounts WHERE id = $1', [id]);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
}
