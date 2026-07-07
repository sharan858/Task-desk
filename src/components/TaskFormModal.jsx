import React, { useState } from 'react';
import Modal from './Modal.jsx';

const emptyForm = { title: '', customer: '', accountId: '', category: 'AM', stage: 'open', priority: 'Medium', dueDate: '', description: '', notes: '' };

export default function TaskFormModal({ accounts, initialTask, lockAccountId, onClose, onSubmit }){
  const [form, setForm] = useState(() => initialTask
    ? {
        title: initialTask.title || '',
        customer: initialTask.customer || '',
        accountId: String(initialTask.account_id),
        category: initialTask.category || 'AM',
        stage: initialTask.stage || 'open',
        priority: initialTask.priority || 'Medium',
        dueDate: initialTask.due_date ? initialTask.due_date.slice(0, 10) : '',
        description: initialTask.description || '',
        notes: initialTask.notes || ''
      }
    : { ...emptyForm, accountId: lockAccountId ? String(lockAccountId) : '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key, value){ setForm(f => ({ ...f, [key]: value })); }

  async function submit(e){
    e.preventDefault();
    if(!form.title.trim()) return setError('Task title is required');
    if(!form.accountId) return setError('Account is required');
    setError(''); setBusy(true);
    try{
      await onSubmit(form);
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
        <div className="modal-head">
          <h3>{initialTask ? 'Edit task' : 'New task'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}
            <div className="grid2">
              <div className="field full">
                <label>Task title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Send renewal quote for FY26–27" autoFocus />
              </div>
              <div className="field">
                <label>Customer name</label>
                <input value={form.customer} onChange={e => set('customer', e.target.value)} placeholder="e.g. Raymond" />
              </div>
              <div className="field">
                <label>Account *</label>
                <select value={form.accountId} onChange={e => set('accountId', e.target.value)} disabled={!!lockAccountId}>
                  <option value="" disabled>Select an account…</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  <option>AM</option>
                  <option>CSM</option>
                </select>
              </div>
              <div className="field">
                <label>Stage</label>
                <select value={form.stage} onChange={e => set('stage', e.target.value)}>
                  <option value="open">Open</option>
                  <option value="priority">Priority</option>
                  <option value="delayed">Delayed</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="field">
                <label>Priority level</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="field">
                <label>Due date</label>
                <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
              <div className="field full">
                <label>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What needs to be done, context, links…" />
              </div>
              <div className="field full">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Running notes — call outcomes, blockers, follow-ups…" />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : initialTask ? 'Save changes' : 'Add task'}</button>
          </div>
        </form>
    </Modal>
  );
}
