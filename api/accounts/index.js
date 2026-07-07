import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;

  if(req.method === 'GET'){
    const result = await query(`
      SELECT
        a.*,
        o.name  AS owner_name,
        m.name  AS account_manager_name,
        COALESCE(s.task_count, 0)     AS task_count,
        COALESCE(s.active_count, 0)   AS active_count,
        COALESCE(s.finished_count, 0) AS finished_count,
        COALESCE(s.overdue_count, 0)  AS overdue_count,
        s.last_activity
      FROM accounts a
      JOIN users o ON o.id = a.owner_id
      JOIN users m ON m.id = a.account_manager_id
      LEFT JOIN (
        SELECT
          account_id,
          COUNT(*) AS task_count,
          COUNT(*) FILTER (WHERE stage NOT IN ('completed','closed')) AS active_count,
          COUNT(*) FILTER (WHERE stage IN ('completed','closed')) AS finished_count,
          COUNT(*) FILTER (WHERE stage NOT IN ('completed','closed') AND due_date IS NOT NULL AND due_date < CURRENT_DATE) AS overdue_count,
          MAX(COALESCE(completed_at, created_at)) AS last_activity
        FROM tasks
        GROUP BY account_id
      ) s ON s.account_id = a.id
      ORDER BY a.name ASC
    `);
    return res.status(200).json({ accounts: result.rows });
  }

  if(req.method === 'POST'){
    const { name, description, health, ownerId, accountManagerId, pocName, pocEmail } = req.body || {};
    if(!name || !name.trim()) return res.status(400).json({ error: 'Account name is required' });
    if(!ownerId) return res.status(400).json({ error: 'Account owner is required' });
    if(!accountManagerId) return res.status(400).json({ error: 'Account manager is required' });
    if(!pocName || !pocName.trim()) return res.status(400).json({ error: 'POC name is required' });
    if(!pocEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pocEmail.trim())) {
      return res.status(400).json({ error: 'A valid POC email is required' });
    }

    try{
      const result = await query(
        `INSERT INTO accounts (name, description, health, owner_id, account_manager_id, poc_name, poc_email, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [name.trim(), description || '', health || 'healthy', ownerId, accountManagerId, pocName.trim(), pocEmail.trim(), user.id]
      );
      return res.status(201).json({ account: result.rows[0] });
    }catch(e){
      if(e.code === '23505') return res.status(409).json({ error: 'An account with that name already exists' });
      throw e;
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
