import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const ROLES = [
  { id: 'csm', label: 'CSM' },
  { id: 'account_manager', label: 'Account Manager' },
  { id: 'both', label: 'Both' }
];

export default function Profile({ onRoleChanged }){
  const { user, updateRole, changePassword } = useAuth();
  const toast = useToast();
  const [roleBusy, setRoleBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  async function selectRole(role){
    if(role === user.role || roleBusy) return;
    setRoleBusy(true);
    try{
      await updateRole(role);
      await onRoleChanged?.();
      toast('Role updated');
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setRoleBusy(false);
    }
  }

  async function submitPassword(e){
    e.preventDefault();
    if(newPassword.length < 8) return setPwError('New password must be at least 8 characters');
    if(newPassword !== confirmPassword) return setPwError('New passwords do not match');
    setPwError(''); setPwBusy(true);
    try{
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast('Password changed');
    }catch(err){
      setPwError(err.message);
    }finally{
      setPwBusy(false);
    }
  }

  return (
    <div>
      <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 420 }}>
        <h4>Your role</h4>
        <p style={{ marginBottom: 10 }}>Choose whether you show up as a CSM or an Account Manager when assigning accounts.</p>
        <div className="seg">
          {ROLES.map(r => (
            <button key={r.id} className={user.role === r.id ? 'on' : ''} disabled={roleBusy} onClick={() => selectRole(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 420 }}>
        <h4>Change password</h4>
        <form onSubmit={submitPassword}>
          {pwError && <div className="auth-error">{pwError}</div>}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Current password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>
          <button className="btn btn-primary" disabled={pwBusy}>{pwBusy ? 'Saving…' : 'Change password'}</button>
        </form>
      </div>
    </div>
  );
}
