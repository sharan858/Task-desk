import React from 'react';
import { STAGES } from '../utils/period.js';

export default function StatStrip({ tasks }){
  const counts = {};
  STAGES.forEach(s => { counts[s.id] = 0; });
  tasks.forEach(t => { if(counts[t.stage] != null) counts[t.stage]++; });

  return (
    <div className="stats">
      {STAGES.map(s => (
        <div key={s.id} className={`stat s-${s.id}`}>
          <div className="n">{counts[s.id]}</div>
          <div className="l">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
