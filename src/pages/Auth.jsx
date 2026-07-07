import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth(){
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e){
    e.preventDefault();
    setError('');
    setBusy(true);
    try{
      if(mode === 'login') await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
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
        <div className="auth-sub">{mode === 'login' ? 'Sign in to your workspace' : 'Create your workspace account'}</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Your name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Shah" required />
            </div>
          )}
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>New to TaskDesk? <button onClick={() => { setMode('register'); setError(''); }}>Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
