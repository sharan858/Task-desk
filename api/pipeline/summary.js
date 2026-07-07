import { query } from '../_db.js';
import { requireAuth } from '../_auth.js';

const OVERDUE_CTE = `
  SELECT account_id, COUNT(*) AS overdue_count
  FROM tasks
  WHERE stage NOT IN ('completed','closed') AND due_date IS NOT NULL AND due_date < CURRENT_DATE
  GROUP BY account_id
`;

async function groupBy(joinColumn, joinTable, joinAlias){
  const result = await query(`
    WITH overdue AS (${OVERDUE_CTE})
    SELECT
      ${joinAlias}.id AS user_id,
      COALESCE(${joinAlias}.name, 'Unassigned') AS name,
      COUNT(a.id)::int AS account_count,
      COALESCE(SUM(a.deal_size), 0)::numeric AS pipeline_value,
      COALESCE(SUM(overdue.overdue_count), 0)::int AS overdue_count
    FROM accounts a
    LEFT JOIN users ${joinAlias} ON ${joinAlias}.id = a.${joinColumn}
    LEFT JOIN overdue ON overdue.account_id = a.id
    GROUP BY ${joinAlias}.id, ${joinAlias}.name
    ORDER BY pipeline_value DESC
  `);
  return result.rows;
}

export default async function handler(req, res){
  const user = requireAuth(req, res);
  if(!user) return;
  if(req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [byCsm, byManager, byHealth, totals] = await Promise.all([
    groupBy('owner_id', 'users', 'o'),
    groupBy('account_manager_id', 'users', 'm'),
    query(`
      WITH overdue AS (${OVERDUE_CTE})
      SELECT
        a.health,
        COUNT(a.id)::int AS account_count,
        COALESCE(SUM(a.deal_size), 0)::numeric AS pipeline_value,
        COALESCE(SUM(overdue.overdue_count), 0)::int AS overdue_count
      FROM accounts a
      LEFT JOIN overdue ON overdue.account_id = a.id
      GROUP BY a.health
      ORDER BY pipeline_value DESC
    `).then(r => r.rows),
    query(`
      WITH overdue AS (${OVERDUE_CTE})
      SELECT
        COUNT(a.id)::int AS account_count,
        COALESCE(SUM(a.deal_size), 0)::numeric AS pipeline_value,
        COALESCE(SUM(overdue.overdue_count), 0)::int AS overdue_count
      FROM accounts a
      LEFT JOIN overdue ON overdue.account_id = a.id
    `).then(r => r.rows[0])
  ]);

  res.status(200).json({ byCsm, byManager, byHealth, totals });
}
