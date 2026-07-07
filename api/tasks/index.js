import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

const FINISHED = ['completed', 'closed'];

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;

  if(req.method === 'GET'){
    const { accountId } = req.query;
    const params = [];
    let sql = `
      SELECT t.*, a.name AS account_name, cb.name AS created_by_name, ub.name AS updated_by_name
      FROM tasks t
      JOIN accounts a ON a.id = t.account_id
      LEFT JOIN users cb ON cb.id = t.created_by
      LEFT JOIN users ub ON ub.id = t.updated_by`;
    if(accountId){
      params.push(accountId);
      sql += ` WHERE t.account_id = $${params.length}`;
    }
    sql += ' ORDER BY t.created_at DESC';
    const result = await query(sql, params);
    return res.status(200).json({ tasks: result.rows });
  }

  if(req.method === 'POST'){
    const { accountId, title, customer, category, priority, stage, dueDate, description, notes } = req.body || {};
    if(!accountId) return res.status(400).json({ error: 'Account is required' });
    if(!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });

    const finalStage = stage || 'open';
    const completedAt = FINISHED.includes(finalStage) ? new Date().toISOString() : null;

    const result = await query(
      `INSERT INTO tasks (account_id, title, customer, category, priority, stage, due_date, description, notes, created_by, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [accountId, title.trim(), customer || '', category || 'AM', priority || 'Medium', finalStage,
       dueDate || null, description || '', notes || '', user.id, completedAt]
    );
    return res.status(201).json({ task: result.rows[0] });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
