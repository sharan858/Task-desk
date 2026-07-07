import React from 'react';
import { fmtFull, healthLabel } from '../utils/period.js';

export default function AccountCard({ account, onOpen }){
  const total = Number(account.task_count) || 0;
  const finished = Number(account.finished_count) || 0;
  const active = Number(account.active_count) || 0;
  const overdue = Number(account.overdue_count) || 0;
  const pct = total ? Math.round((finished / total) * 100) : 0;

  return (
    <div className="acct" onClick={() => onOpen(account.id)}>
      <div className="acct-name-row">
        <div className="acct-name">{account.name}</div>
        <span className={`chip health-${account.health}`}>{healthLabel(account.health)}</span>
      </div>
      {account.description && <div className="acct-desc">{account.description}</div>}
      <div className="acct-people">
        <span>CSM: <b>{account.owner_name || 'Unassigned'}</b></span>
        <span>Manager: <b>{account.account_manager_name}</b></span>
      </div>
      <div className="acct-nums">
        <span><b>{total}</b> total</span>
        <span><b>{active}</b> active</span>
        <span><b>{finished}</b> finished</span>
        {overdue > 0 && <span className="warn"><b>{overdue}</b> overdue</span>}
      </div>
      <div className="acct-bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="acct-last">{account.last_activity ? `Last activity ${fmtFull(new Date(account.last_activity))}` : 'No tasks yet'}</div>
    </div>
  );
}
