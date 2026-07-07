import React, { useState } from 'react';
import { isOverdue, isDueSoon } from '../utils/period.js';

export default function OverdueBanner({ tasks }){
  const [dismissed, setDismissed] = useState(false);

  const overdueCount = tasks.filter(isOverdue).length;
  const dueSoonCount = tasks.filter(t => isDueSoon(t)).length;

  if(dismissed || (overdueCount === 0 && dueSoonCount === 0)) return null;

  const parts = [];
  if(overdueCount > 0) parts.push(`${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`);
  if(dueSoonCount > 0) parts.push(`${dueSoonCount} due in the next 3 days`);

  return (
    <div className="digest-banner">
      <span>⚠ {parts.join(' · ')}</span>
      <button className="icon-btn" title="Dismiss" onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}
