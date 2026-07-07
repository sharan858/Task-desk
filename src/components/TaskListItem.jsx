import React, { useState } from 'react';
import { STAGES, FINISHED, stageLabel, isOverdue, fmt, fmtFull } from '../utils/period.js';

export default function TaskListItem({ task, accountName, onToggleDone, onStageChange, onCategoryChange, onSaveNotes, onEdit, onDelete }){
  const overdue = isOverdue(task);
  const finished = FINISHED.includes(task.stage);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(task.notes || '');

  function startEditNotes(){
    setNotesDraft(task.notes || '');
    setEditingNotes(true);
  }
  function saveNotes(){
    onSaveNotes(task.id, notesDraft.trim());
    setEditingNotes(false);
  }

  return (
    <div className={`task ${finished ? 'finished' : ''}`}>
      <div className="task-row">
        <button className="check" title={finished ? 'Reopen' : 'Mark completed'} onClick={() => onToggleDone(task)} />
        <div className="task-main">
          <div className="task-title">{task.title}</div>
          <div className="chips">
            {task.category && <span className="chip cat">{task.category}</span>}
            <span className={`chip stage st-${task.stage}`}>{stageLabel(task.stage)}</span>
            <span className="chip">{accountName}</span>
            {task.customer && <span className="chip person">👤 {task.customer}</span>}
            <span className={`chip p-${task.priority}`}>{task.priority}</span>
            {task.due_date && (
              <span className={`chip due ${overdue ? 'overdue' : ''}`}>
                {overdue ? '⚠ ' : ''}Due {fmt(new Date(task.due_date + 'T00:00:00'))}
              </span>
            )}
          </div>
          {task.description && <div className="task-desc">{task.description}</div>}

          {editingNotes ? (
            <div className="notes-area notes-edit">
              <div className="notes-label">Notes</div>
              <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} autoFocus />
              <div className="row">
                <button className="btn btn-primary mini" onClick={saveNotes}>Save notes</button>
                <button className="btn btn-ghost mini" onClick={() => setEditingNotes(false)}>Cancel</button>
              </div>
            </div>
          ) : task.notes ? (
            <div className="notes-area">
              <div className="notes-label">Notes</div>
              <div className="notes-view">{task.notes}</div>
            </div>
          ) : null}

          <div className="meta-line">
            Created {fmtFull(new Date(task.created_at))}
            {task.completed_at ? ` · Finished ${fmtFull(new Date(task.completed_at))}` : ''}
          </div>
        </div>
        <div className="task-actions">
          <select className="stage-select" value={task.category} onChange={e => onCategoryChange(task.id, e.target.value)} title="Category">
            <option>AM</option>
            <option>CSM</option>
          </select>
          <select className="stage-select" value={task.stage} onChange={e => onStageChange(task.id, e.target.value)} title="Move to stage">
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button className="icon-btn" title="Edit notes" onClick={startEditNotes}>✎</button>
          <button className="icon-btn" title="Edit task" onClick={() => onEdit(task)}>⚙</button>
          <button className="icon-btn" title="Delete" onClick={() => onDelete(task.id)}>🗑</button>
        </div>
      </div>
    </div>
  );
}
