import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import Auth from './pages/Auth.jsx';
import Ledger from './components/Ledger.jsx';
import TaskView from './pages/TaskView.jsx';
import AccountView from './pages/AccountView.jsx';
import Profile from './pages/Profile.jsx';
import ImportExport from './pages/ImportExport.jsx';
import PipelineDashboard from './pages/PipelineDashboard.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

export default function App(){
  const { user, loading } = useAuth();
  const toast = useToast();

  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('resetToken'));
  const [mainView, setMainView] = useState('tasks');
  const [periodType, setPeriodType] = useState('day');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [ring, setRing] = useState({ done: 0, total: 0, pct: 0 });

  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const refreshAccounts = useCallback(async () => {
    try{
      const { accounts } = await api.accounts();
      setAccounts(accounts);
    }catch(err){ toast(err.message, 'error'); }
  }, [toast]);

  const refreshUsers = useCallback(async () => {
    try{
      const { users } = await api.users();
      setUsers(users);
    }catch(err){ toast(err.message, 'error'); }
  }, [toast]);

  useEffect(() => {
    if(!user) return;
    (async () => {
      setDataLoading(true);
      try{
        const [{ accounts }, { users }] = await Promise.all([api.accounts(), api.users()]);
        setAccounts(accounts);
        setUsers(users);
      }catch(err){
        toast(err.message, 'error');
      }finally{
        setDataLoading(false);
      }
    })();
  }, [user]);

  function changePeriodType(t){
    setPeriodType(t);
    setPeriodOffset(0);
  }

  if(resetToken){
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => window.history.replaceState({}, '', window.location.pathname)}
      />
    );
  }

  if(loading) return <div className="spinner" style={{ marginTop: '30vh' }} />;
  if(!user) return <Auth />;

  return (
    <div className="shell">
      <Ledger
        mainView={mainView}
        periodType={periodType}
        periodOffset={periodOffset}
        setPeriodType={changePeriodType}
        shiftPeriod={n => setPeriodOffset(o => o + n)}
        goCurrentPeriod={() => setPeriodOffset(0)}
        ring={ring}
      />

      <div className="toolbar" style={{ marginTop: 14 }}>
        <div className="seg">
          <button className={mainView === 'tasks' ? 'on' : ''} onClick={() => setMainView('tasks')}>🗒 Task View</button>
          <button className={mainView === 'accounts' ? 'on' : ''} onClick={() => setMainView('accounts')}>◈ Account View</button>
          <button className={mainView === 'pipeline' ? 'on' : ''} onClick={() => setMainView('pipeline')}>📊 Pipeline</button>
          <button className={mainView === 'profile' ? 'on' : ''} onClick={() => setMainView('profile')}>👤 Profile</button>
          <button className={mainView === 'importExport' ? 'on' : ''} onClick={() => setMainView('importExport')}>⇄ Import / Export</button>
        </div>
      </div>

      {mainView === 'profile' ? (
        <Profile onRoleChanged={refreshUsers} />
      ) : dataLoading ? (
        <div className="spinner" />
      ) : mainView === 'tasks' ? (
        <TaskView
          accounts={accounts}
          periodType={periodType}
          periodOffset={periodOffset}
          onRingChange={setRing}
        />
      ) : mainView === 'importExport' ? (
        <ImportExport accounts={accounts} users={users} onRefreshAccounts={refreshAccounts} />
      ) : mainView === 'pipeline' ? (
        <PipelineDashboard />
      ) : (
        <AccountView accounts={accounts} users={users} onRefreshAccounts={refreshAccounts} />
      )}
    </div>
  );
}
