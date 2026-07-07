import React from 'react';
import { STAGES, FINISHED, isOverdue, fmt } from '../utils/period.js';

export default function TaskCard({ task, accountName, onDragStart, onDragEnd, onStageChange, onEdit, onDelete }){
  const overdue = isOverdue(task);
  const finished = FINISHED.includes(task.stage);

  return (
    <div
      className={`bcard ${finished ? 'strike' : ''}`}
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
    >
      <div className="t">{task.title}</div>
      <div className="chips">
        {task.category && <span className="chip cat">{task.category}</span>}
        <span className="chip">{accountName}</span>
        {task.customer && <span className="chip person">👤 {task.customer}</span>}
        <span className={`chip p-${task.priority}`}>{task.priority}</span>
        {task.due_date && (
          <span className={`chip due ${overdue ? 'overdue' : ''}`}>
            {overdue ? '⚠ ' : ''}{fmt(new Date(task.due_date + 'T00:00:00'))}
          </span>
        )}
      </div>
      <div className="bcard-foot">
        <select value={task.stage} onChange={e => onStageChange(task.id, e.target.value)} title="Move to stage">
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button className="icon-btn" title="Open details & notes" onClick={() => onEdit(task)}>✎</button>
        <button className="icon-btn" title="Delete" onClick={() => onDelete(task.id)}>🗑</button>
      </div>
    </div>
  );
}
