import React from 'react';
import { FINISHED, taskAnchor } from '../utils/period.js';
import TaskListItem from './TaskListItem.jsx';

export default function TaskList({ tasks, allTasksEmpty, accountNameOf, ...handlers }){
  if(!tasks.length){
    return (
      <div className="empty">
        {allTasksEmpty
          ? <><b>No tasks yet.</b><br />Add your first one above — renewals, follow-ups, escalations, MoM action items.</>
          : <><b>Nothing matches.</b><br />Try a different day, week, month, filter, or search term.</>}
      </div>
    );
  }

  const active = tasks.filter(t => !FINISHED.includes(t.stage)).sort((a, b) => taskAnchor(a) - taskAnchor(b));
  const finished = tasks.filter(t => FINISHED.includes(t.stage))
    .sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at));

  return (
    <>
      {active.length > 0 && (
        <div className="daygroup">
          <h3>Active · {active.length}</h3>
          {active.map(t => <TaskListItem key={t.id} task={t} accountName={accountNameOf(t)} {...handlers} />)}
        </div>
      )}
      {finished.length > 0 && (
        <div className="daygroup">
          <h3>Finished · {finished.length}</h3>
          {finished.map(t => <TaskListItem key={t.id} task={t} accountName={accountNameOf(t)} {...handlers} />)}
        </div>
      )}
    </>
  );
}
