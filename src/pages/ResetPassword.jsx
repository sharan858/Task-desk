import React, { useState } from 'react';
import { api } from '../api.js';

export default function ResetPassword({ token, onDone }){
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e){
    e.preventDefault();
    if(newPassword.length < 8) return setError('New password must be at least 8 characters');
    if(newPassword !== confirmPassword) return setError('Passwords do not match');
    setError(''); setBusy(true);
    try{
      await api.resetPassword(token, newPassword);
      setDone(true);
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">Zuper · Account Management</div>
        <h1>TaskDesk</h1>
        <div className="auth-sub">{done ? 'Password updated' : 'Choose a new password'}</div>

        {done ? (
          <>
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13.5, marginBottom: 18 }}>
              Your password has been reset. You can now sign in with your new password.
            </p>
            <button className="btn btn-primary btn-block" onClick={onDone}>Go to sign in</button>
          </>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="auth-error">{error}</div>}
            <div className="field" style={{ marginBottom: 12 }}>
              <label>New password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={8} autoFocus />
            </div>
            <div className="field" style={{ marginBottom: 18 }}>
              <label>Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
