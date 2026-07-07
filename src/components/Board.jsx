import React, { useState } from 'react';
import { STAGES, taskAnchor } from '../utils/period.js';
import TaskCard from './TaskCard.jsx';

export default function Board({ tasks, accountNameOf, onStageChange, onEdit, onDelete }){
  const [dragId, setDragId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  function onDragStart(e, id){
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDrop(e, stage){
    e.preventDefault();
    setDragOverStage(null);
    if(dragId) onStageChange(dragId, stage);
    setDragId(null);
  }

  return (
    <div className="board">
      {STAGES.map(st => {
        const items = tasks.filter(t => t.stage === st.id).sort((a, b) => taskAnchor(a) - taskAnchor(b));
        return (
          <div
            key={st.id}
            className={`col ${dragOverStage === st.id ? 'dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOverStage(st.id); }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={e => onDrop(e, st.id)}
          >
            <div className="col-head">
              <span className="col-dot" style={{ background: st.dot }} />{st.label}
              <span className="col-count">{items.length}</span>
            </div>
            <div className="col-body">
              {items.length
                ? items.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      accountName={accountNameOf(t)}
                      onDragStart={onDragStart}
                      onDragEnd={() => setDragId(null)}
                      onStageChange={onStageChange}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                : <div className="col-empty">Drop tasks here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
