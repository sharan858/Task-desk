export const STAGES = [
  { id: 'open', label: 'Open', dot: '#2E5CE6' },
  { id: 'priority', label: 'Priority', dot: '#B42318' },
  { id: 'delayed', label: 'Delayed', dot: '#C2410C' },
  { id: 'completed', label: 'Completed', dot: '#0E9F6E' },
  { id: 'closed', label: 'Closed', dot: '#6B7280' }
];
export const FINISHED = ['completed', 'closed'];

export const HEALTHS = [
  { id: 'healthy', label: 'Healthy' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'at_risk', label: 'At Risk' },
  { id: 'critical', label: 'Critical' }
];

export function stageLabel(id){
  return STAGES.find(s => s.id === id)?.label || id;
}
export function healthLabel(id){
  return HEALTHS.find(h => h.id === id)?.label || id;
}

export function fmt(d){ return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
export function fmtFull(d){ return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export function taskAnchor(t){
  return t.due_date ? new Date(t.due_date + 'T00:00:00') : new Date(t.created_at);
}
export function todayStart(){
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}
export function isOverdue(t){
  return !FINISHED.includes(t.stage) && t.due_date && new Date(t.due_date + 'T00:00:00') < todayStart();
}

function dayStart(offset){ const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d; }
function dayEnd(offset){ const s = dayStart(offset); const e = new Date(s); e.setDate(e.getDate() + 1); return e; }
export function startOfWeek(offset){
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + offset * 7);
  return d;
}
export function endOfWeek(offset){
  const s = startOfWeek(offset);
  const e = new Date(s); e.setDate(e.getDate() + 7);
  return e;
}
function monthStart(offset){ const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(1); d.setMonth(d.getMonth() + offset); return d; }
function monthEnd(offset){ const s = monthStart(offset); const e = new Date(s); e.setMonth(e.getMonth() + 1); return e; }

export function startOfPeriod(periodType, offset){
  if(periodType === 'day') return dayStart(offset);
  if(periodType === 'month') return monthStart(offset);
  return startOfWeek(offset);
}
export function endOfPeriod(periodType, offset){
  if(periodType === 'day') return dayEnd(offset);
  if(periodType === 'month') return monthEnd(offset);
  return endOfWeek(offset);
}
export function inPeriod(t, periodType, offset){
  const a = taskAnchor(t);
  return a >= startOfPeriod(periodType, offset) && a < endOfPeriod(periodType, offset);
}
export function periodWord(periodType){
  return periodType === 'day' ? 'today' : periodType === 'month' ? 'this month' : 'this week';
}
export function currentPeriodBtnLabel(periodType){
  return periodType === 'day' ? 'Today' : periodType === 'month' ? 'This month' : 'This week';
}
export function periodLabelText(periodType, offset){
  const s = startOfPeriod(periodType, offset);
  const e = new Date(endOfPeriod(periodType, offset) - 1);
  if(periodType === 'day'){
    return (offset === 0 ? 'Today · ' : '') + s.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  if(periodType === 'month'){
    return (offset === 0 ? 'This month · ' : '') + s.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  return (offset === 0 ? 'This week · ' : '') + fmt(s) + ' – ' + fmtFull(e);
}
