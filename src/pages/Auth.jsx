import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

export default function Auth(){
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function submit(e){
    e.preventDefault();
    setError('');
    setBusy(true);
    try{
      if(mode === 'login') await login(email.trim(), password);
      else if(mode === 'register') await register(name.trim(), email.trim(), password);
      else{
        await api.forgotPassword(email.trim());
        setForgotSent(true);
      }
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  }

  function switchMode(next){
    setMode(next);
    setError('');
    setForgotSent(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">Zuper · Account Management</div>
        <h1>TaskDesk</h1>
        <div className="auth-sub">
          {mode === 'login' ? 'Sign in to your workspace' : mode === 'register' ? 'Create your workspace account' : 'Reset your password'}
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === 'forgot' && forgotSent ? (
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13.5, marginBottom: 18 }}>
            If an account with that email exists, we've sent a reset link. Check your inbox.
          </p>
        ) : (
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
            {mode !== 'forgot' && (
              <div className="field" style={{ marginBottom: 18 }}>
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
              </div>
            )}
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <div className="auth-toggle">
            <button onClick={() => switchMode('forgot')}>Forgot password?</button>
          </div>
        )}

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>New to TaskDesk? <button onClick={() => switchMode('register')}>Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
