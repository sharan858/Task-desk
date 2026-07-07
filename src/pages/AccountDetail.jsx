import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { FINISHED, fmtFull, healthLabel } from '../utils/period.js';
import StatStrip from '../components/StatStrip.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskFormModal from '../components/TaskFormModal.jsx';
import AccountFormModal from '../components/AccountFormModal.jsx';

export default function AccountDetail({ accountId, accounts, users, onBack, onAccountChanged, onAccountDeleted }){
  const toast = useToast();
  const confirm = useConfirm();

  const [account, setAccount] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState(undefined);
  const [editingAccount, setEditingAccount] = useState(false);

  async function load(){
    setLoading(true);
    try{
      const [{ account }, { tasks }] = await Promise.all([api.getAccount(accountId), api.tasks(accountId)]);
      setAccount(account);
      setTasks(tasks);
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [accountId]);

  const contacts = useMemo(() => [...new Set(tasks.map(t => t.customer).filter(Boolean))], [tasks]);
  const finishedCount = tasks.filter(t => FINISHED.includes(t.stage)).length;
  const pct = tasks.length ? Math.round((finishedCount / tasks.length) * 100) : 0;

  async function handleStageChange(id, stage){
    try{
      const { task } = await api.updateTask(id, { stage });
      setTasks(ts => ts.map(t => t.id === task.id ? task : t));
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
      onAccountChanged();
      toast('Task deleted');
    }catch(err){ toast(err.message, 'error'); }
  }
  async function handleTaskModalSubmit(form){
    if(modalTask){
      const { task } = await api.updateTask(modalTask.id, form);
      setTasks(ts => ts.map(t => t.id === task.id ? task : t));
      toast('Task updated');
    }else{
      const { task } = await api.createTask(form);
      setTasks(ts => [task, ...ts]);
      toast('Task added');
    }
    onAccountChanged();
    setModalTask(undefined);
  }
  async function handleAccountEditSubmit(form){
    const { account: updated } = await api.updateAccount(account.id, form);
    setAccount(updated);
    onAccountChanged();
    toast('Account updated');
    setEditingAccount(false);
  }
  async function handleDeleteAccount(){
    const ok = await confirm(`Remove "${account.name}" from your account base?`, { danger: true, confirmLabel: 'Remove' });
    if(!ok) return;
    try{
      await api.deleteAccount(account.id);
      toast('Account removed');
      onAccountDeleted();
    }catch(err){
      toast(err.message, 'error');
    }
  }
  function exportCSV(){
    if(!tasks.length){ toast('No tasks for this account yet'); return; }
    const head = ['Category', 'Task', 'Account Name', 'Customer Name', 'Stage', 'Priority', 'Due Date', 'Description', 'Notes', 'Created At', 'Finished At'];
    const cell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows = tasks.map(t => [
      t.category, t.title, account.name, t.customer, t.stage, t.priority,
      t.due_date || '', t.description, t.notes,
      new Date(t.created_at).toLocaleString('en-IN'),
      t.completed_at ? new Date(t.completed_at).toLocaleString('en-IN') : ''
    ].map(cell).join(','));
    const csv = '﻿' + [head.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const slug = account.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    a.download = `taskdesk-${slug}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }

  if(loading || !account) return <div className="spinner" />;

  return (
    <div className="acct-detail">
      <div className="acct-head">
        <button className="btn btn-ghost mini" onClick={onBack}>‹ All accounts</button>
        <h2>{account.name}</h2>
        <span className={`chip health-${account.health}`}>{healthLabel(account.health)}</span>
        <div className="acct-head-actions">
          <button className="btn btn-ghost mini" onClick={() => setEditingAccount(true)}>Edit</button>
          <button className="btn btn-ghost mini" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn btn-danger mini" onClick={handleDeleteAccount}>Remove</button>
        </div>
      </div>

      <div className="acct-info-grid">
        <div className="acct-info-card">
          <h4>Description</h4>
          <p>{account.description || 'No description yet — click Edit to add context about this account.'}</p>
        </div>
        <div className="acct-info-card">
          <h4>People</h4>
          <p>
            <b>CSM:</b> {account.owner_name || 'Unassigned'}<br />
            <b>Account Manager:</b> {account.account_manager_name || 'Unassigned'}<br />
            <b>Point of Contact:</b> {account.poc_name} (<a href={`mailto:${account.poc_email}`}>{account.poc_email}</a>)<br />
            <b>Deal Size:</b> {account.deal_size != null ? `$${Number(account.deal_size).toLocaleString()}` : 'Not set'}
          </p>
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="acct-contacts">
          Contacts: {contacts.map(c => <span key={c} className="chip person">👤 {c}</span>)}
        </div>
      )}

      <StatStrip tasks={tasks} />
      <div className="acct-progress">Account progress: <b>{finishedCount}</b> of <b>{tasks.length}</b> tasks finished ({pct}%)</div>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setModalTask(null)}>＋ New task for this account</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <TaskList
          tasks={tasks}
          allTasksEmpty={tasks.length === 0}
          accountNameOf={() => account.name}
          onToggleDone={handleToggleDone}
          onStageChange={handleStageChange}
          onCategoryChange={handleCategoryChange}
          onSaveNotes={handleSaveNotes}
          onEdit={setModalTask}
          onDelete={handleDelete}
        />
      </div>

      {modalTask !== undefined && (
        <TaskFormModal
          accounts={accounts}
          initialTask={modalTask}
          lockAccountId={account.id}
          onClose={() => setModalTask(undefined)}
          onSubmit={handleTaskModalSubmit}
        />
      )}
      {editingAccount && (
        <AccountFormModal
          users={users}
          initialAccount={account}
          onClose={() => setEditingAccount(false)}
          onSubmit={handleAccountEditSubmit}
        />
      )}
    </div>
  );
}
