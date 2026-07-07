import React, { useState } from 'react';
import { HEALTHS } from '../utils/period.js';
import Modal from './Modal.jsx';

export default function AccountFormModal({ users, initialAccount, onClose, onSubmit }){
  const [form, setForm] = useState(() => initialAccount
    ? {
        name: initialAccount.name || '',
        description: initialAccount.description || '',
        health: initialAccount.health || 'healthy',
        ownerId: initialAccount.owner_id ? String(initialAccount.owner_id) : '',
        accountManagerId: String(initialAccount.account_manager_id),
        pocName: initialAccount.poc_name || '',
        pocEmail: initialAccount.poc_email || ''
      }
    : { name: '', description: '', health: 'healthy', ownerId: '', accountManagerId: '', pocName: '', pocEmail: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const csmOptions = users.filter(u => u.role === 'csm');
  const managerOptions = users.filter(u => u.role === 'account_manager' || u.role === 'both');

  function set(key, value){ setForm(f => ({ ...f, [key]: value })); }

  async function submit(e){
    e.preventDefault();
    if(!form.name.trim()) return setError('Account name is required');
    if(!form.accountManagerId) return setError('Account manager is required');
    if(!form.pocName.trim()) return setError('POC name is required');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.pocEmail.trim())) return setError('A valid POC email is required');
    setError(''); setBusy(true);
    try{
      await onSubmit({ ...form, ownerId: form.ownerId || null });
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
                <label>CSM</label>
                <select value={form.ownerId} onChange={e => set('ownerId', e.target.value)}>
                  <option value="">Unassigned</option>
                  {csmOptions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Account Manager *</label>
                <select value={form.accountManagerId} onChange={e => set('accountManagerId', e.target.value)}>
                  <option value="" disabled>Select a manager…</option>
                  {managerOptions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="field full">
                <label>Account health</label>
                <select value={form.health} onChange={e => set('health', e.target.value)}>
                  {HEALTHS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Point of Contact *</label>
                <input value={form.pocName} onChange={e => set('pocName', e.target.value)} placeholder="e.g. Jane Smith" />
              </div>
              <div className="field">
                <label>POC Email *</label>
                <input type="email" value={form.pocEmail} onChange={e => set('pocEmail', e.target.value)} placeholder="jane@customer.com" />
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
