import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

const FIELD_MAP = {
  name: 'name',
  description: 'description',
  health: 'health',
  ownerId: 'owner_id',
  accountManagerId: 'account_manager_id',
  pocName: 'poc_name',
  pocEmail: 'poc_email',
  dealSize: 'deal_size'
};

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;
  const { id } = req.query;

  if(req.method === 'GET'){
    const result = await query(`
      SELECT a.*, o.name AS owner_name, m.name AS account_manager_name,
        cb.name AS created_by_name, ub.name AS updated_by_name
      FROM accounts a
      LEFT JOIN users o ON o.id = a.owner_id
      LEFT JOIN users m ON m.id = a.account_manager_id
      LEFT JOIN users cb ON cb.id = a.created_by
      LEFT JOIN users ub ON ub.id = a.updated_by
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
    if(fields.dealSize !== undefined && fields.dealSize !== null && fields.dealSize !== ''){
      const n = Number(fields.dealSize);
      if(Number.isNaN(n) || n < 0) return res.status(400).json({ error: 'Deal size must be a valid non-negative number' });
    }
    const sets = []; const values = []; let i = 1;
    for(const key in FIELD_MAP){
      if(fields[key] !== undefined){
        sets.push(`${FIELD_MAP[key]} = $${i++}`);
        let value = fields[key];
        if(key === 'ownerId' || key === 'accountManagerId') value = value || null;
        if(key === 'dealSize') value = (value === '' || value === null) ? null : Number(value);
        values.push(value);
      }
    }
    if(!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push(`updated_by = $${i++}`);
    values.push(user.id);
    sets.push('updated_at = now()');
    values.push(id);

    try{
      const result = await query(`UPDATE accounts SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`, values);
      if(!result.rows.length) return res.status(404).json({ error: 'Account not found' });
      const joined = await query(`
        SELECT a.*, o.name AS owner_name, m.name AS account_manager_name,
          cb.name AS created_by_name, ub.name AS updated_by_name
        FROM accounts a
        LEFT JOIN users o ON o.id = a.owner_id
        LEFT JOIN users m ON m.id = a.account_manager_id
        LEFT JOIN users cb ON cb.id = a.created_by
        LEFT JOIN users ub ON ub.id = a.updated_by
        WHERE a.id = $1`, [result.rows[0].id]);
      return res.status(200).json({ account: joined.rows[0] });
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
