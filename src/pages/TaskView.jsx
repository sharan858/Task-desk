import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { FINISHED, inPeriod, taskAnchor, startOfPeriod } from '../utils/period.js';
import StatStrip from '../components/StatStrip.jsx';
import Board from '../components/Board.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskFormModal from '../components/TaskFormModal.jsx';

export default function TaskView({ accounts, periodType, periodOffset, onRingChange }){
  const toast = useToast();
  const confirm = useConfirm();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState('board');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [modalTask, setModalTask] = useState(undefined); // undefined = closed, null = create, object = edit

  const accountNameOf = (t) => t.account_name || accounts.find(a => String(a.id) === String(t.account_id))?.name || '';

  async function loadTasks(){
    setLoading(true);
    try{
      const { tasks } = await api.tasks();
      setTasks(tasks);
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  const periodTasks = useMemo(
    () => tasks.filter(t => inPeriod(t, periodType, periodOffset)),
    [tasks, periodType, periodOffset]
  );

  useEffect(() => {
    const finished = periodTasks.filter(t => FINISHED.includes(t.stage)).length;
    const total = periodTasks.length;
    onRingChange({ done: finished, total, pct: total ? Math.round((finished / total) * 100) : 0 });
  }, [periodTasks]);

  const visible = useMemo(() => {
    let vis = periodTasks;
    if(filterCategory !== 'all') vis = vis.filter(t => t.category === filterCategory);
    if(filterPriority !== 'all') vis = vis.filter(t => t.priority === filterPriority);
    if(filterStage !== 'all') vis = vis.filter(t => t.stage === filterStage);
    if(filterAccount !== 'all') vis = vis.filter(t => String(t.account_id) === filterAccount);
    if(search.trim()){
      const q = search.trim().toLowerCase();
      vis = vis.filter(t => `${t.title} ${t.customer} ${accountNameOf(t)} ${t.description} ${t.notes}`.toLowerCase().includes(q));
    }
    return vis;
  }, [periodTasks, filterCategory, filterPriority, filterStage, filterAccount, search]);

  async function handleStageChange(id, stage){
    try{
      const { task } = await api.updateTask(id, { stage });
      setTasks(ts => ts.map(t => t.id === task.id ? task : t));
      if(stage === 'completed') toast('Nice — task completed ✓');
      else if(stage === 'closed') toast('Task closed');
      else toast('Moved to ' + stage);
    }catch(err){ toast(err.message, 'error'); }
  }
  async function handleCategoryChange(id, category){
    try{
      const { task } = await api.updateTask(id, { category });
      setTasks(ts => ts.map(t => t.id === task.id ? task : t));
    }catch(err){ toast(err.message, 'error'); }
  }
  async function handleToggleDone(task){
    await handleStageChange(task.id, FINISHED.includes(task.stage) ? 'open' : 'completed');
  }
  async function handleSaveNotes(id, notes){
    try{
      const { task } = await api.updateTask(id, { notes });
      setTasks(ts => ts.map(t => t.id === task.id ? task : t));
      toast('Notes saved');
    }catch(err){ toast(err.message, 'error'); }
  }
  async function handleDelete(id){
    const ok = await confirm('Delete this task permanently?', { danger: true, confirmLabel: 'Delete' });
    if(!ok) return;
    try{
      await api.deleteTask(id);
      setTasks(ts => ts.filter(t => t.id !== id));
      toast('Task deleted');
    }catch(err){ toast(err.message, 'error'); }
  }
  async function handleModalSubmit(form){
    if(modalTask){
      const { task } = await api.updateTask(modalTask.id, form);
      setTasks(ts => ts.map(t => t.id === task.id ? task : t));
      toast('Task updated');
    }else{
      const { task } = await api.createTask(form);
      setTasks(ts => [task, ...ts]);
      toast('Task added');
    }
    setModalTask(undefined);
  }

  function exportCSV(){
    if(!visible.length){ toast('Nothing to export'); return; }
    const head = ['Category', 'Task', 'Account Name', 'Customer Name', 'Stage', 'Priority', 'Due Date', 'Description', 'Notes', 'Created At', 'Finished At'];
    const cell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = visible.map(t => [
      t.category, t.title, accountNameOf(t), t.customer, t.stage, t.priority,
      t.due_date || '', t.description, t.notes,
      new Date(t.created_at).toLocaleString('en-IN'),
      t.completed_at ? new Date(t.completed_at).toLocaleString('en-IN') : ''
    ].map(cell).join(','));
    const csv = '﻿' + [head.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `taskdesk-${periodType}-${startOfPeriod(periodType, periodOffset).toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <StatStrip tasks={periodTasks} />

      <div className="toolbar">
        <div className="seg">
          <button className={layout === 'board' ? 'on' : ''} onClick={() => setLayout('board')}>▦ Board</button>
          <button className={layout === 'list' ? 'on' : ''} onClick={() => setLayout('list')}>☰ List</button>
        </div>
        <input className="search" placeholder="Search task, customer, account…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">AM + CSM</option>
          <option>AM</option>
          <option>CSM</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All priorities</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="all">All stages</option>
          <option value="open">Open</option>
          <option value="priority">Priority</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
          <option value="all">All accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setModalTask(null)}>＋ New task</button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : layout === 'board' ? (
        <Board tasks={visible} accountNameOf={accountNameOf} onStageChange={handleStageChange} onEdit={setModalTask} onDelete={handleDelete} />
      ) : (
        <TaskList
          tasks={visible}
          allTasksEmpty={tasks.length === 0}
          accountNameOf={accountNameOf}
          onToggleDone={handleToggleDone}
          onStageChange={handleStageChange}
          onCategoryChange={handleCategoryChange}
          onSaveNotes={handleSaveNotes}
          onEdit={setModalTask}
          onDelete={handleDelete}
        />
      )}

      <div className="exportbar">
        <button className="btn btn-ghost" onClick={exportCSV}>⬇ Export current view (CSV)</button>
        <span className="hint">CSV opens in Excel / Google Sheets.</span>
      </div>

      {modalTask !== undefined && (
        <TaskFormModal
          accounts={accounts}
          initialTask={modalTask}
          onClose={() => setModalTask(undefined)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
