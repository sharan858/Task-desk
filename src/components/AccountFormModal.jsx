import React, { useState } from 'react';
import { HEALTHS } from '../utils/period.js';
import Modal from './Modal.jsx';

export default function AccountFormModal({ users, initialAccount, onClose, onSubmit }){
  const [form, setForm] = useState(() => initialAccount
    ? {
        name: initialAccount.name || '',
        description: initialAccount.description || '',
        health: initialAccount.health || 'healthy',
        ownerId: String(initialAccount.owner_id),
        accountManagerId: String(initialAccount.account_manager_id)
      }
    : { name: '', description: '', health: 'healthy', ownerId: '', accountManagerId: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key, value){ setForm(f => ({ ...f, [key]: value })); }

  async function submit(e){
    e.preventDefault();
    if(!form.name.trim()) return setError('Account name is required');
    if(!form.ownerId) return setError('Account owner is required');
    if(!form.accountManagerId) return setError('Account manager is required');
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
          <h3>{initialAccount ? 'Edit account' : 'New account'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}
            <div className="grid2">
              <div className="field full">
                <label>Account Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Preference Pools & Spa" autoFocus />
              </div>
              <div className="field">
                <label>Account Owner *</label>
                <select value={form.ownerId} onChange={e => set('ownerId', e.target.value)}>
                  <option value="" disabled>Select an owner…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Account Manager *</label>
                <select value={form.accountManagerId} onChange={e => set('accountManagerId', e.target.value)}>
                  <option value="" disabled>Select a manager…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="field full">
                <label>Account health</label>
                <select value={form.health} onChange={e => set('health', e.target.value)}>
                  {HEALTHS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                </select>
              </div>
              <div className="field full">
                <label>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What this account is about, key context, relationship history…" />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : initialAccount ? 'Save changes' : 'Create account'}</button>
          </div>
        </form>
    </Modal>
  );
}
