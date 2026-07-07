import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

const FINISHED = ['completed', 'closed'];
const FIELD_MAP = {
  title: 'title',
  customer: 'customer',
  category: 'category',
  priority: 'priority',
  stage: 'stage',
  dueDate: 'due_date',
  description: 'description',
  notes: 'notes',
  accountId: 'account_id'
};

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;
  const { id } = req.query;

  if(req.method === 'PATCH'){
    const fields = req.body || {};
    const sets = []; const values = []; let i = 1;
    for(const key in FIELD_MAP){
      if(fields[key] !== undefined){ sets.push(`${FIELD_MAP[key]} = $${i++}`); values.push(fields[key]); }
    }
    if(fields.stage !== undefined){
      sets.push(`completed_at = $${i++}`);
      values.push(FINISHED.includes(fields.stage) ? new Date().toISOString() : null);
    }
    if(!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push(`updated_by = $${i++}`);
    values.push(user.id);
    sets.push('updated_at = now()');
    values.push(id);

    const result = await query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`, values);
    if(!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    const joined = await query(`
      SELECT t.*, a.name AS account_name, cb.name AS created_by_name, ub.name AS updated_by_name
      FROM tasks t
      JOIN accounts a ON a.id = t.account_id
      LEFT JOIN users cb ON cb.id = t.created_by
      LEFT JOIN users ub ON ub.id = t.updated_by
      WHERE t.id = $1`, [result.rows[0].id]);
    return res.status(200).json({ task: joined.rows[0] });
  }

  if(req.method === 'DELETE'){
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
}
