import React, { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AccountCard from '../components/AccountCard.jsx';
import AccountFormModal from '../components/AccountFormModal.jsx';
import AccountDetail from './AccountDetail.jsx';

export default function AccountView({ accounts, users, onRefreshAccounts }){
  const { user } = useAuth();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  const visibleAccounts = useMemo(() => {
    if(!mineOnly) return accounts;
    return accounts.filter(a => String(a.owner_id) === String(user.id) || String(a.account_manager_id) === String(user.id));
  }, [accounts, mineOnly, user.id]);

  async function handleCreate(form){
    const { account } = await api.createAccount(form);
    await onRefreshAccounts();
    toast('Account created');
    setCreating(false);
    setSelectedId(account.id);
  }

  if(selectedId){
    return (
      <AccountDetail
        accountId={selectedId}
        accounts={accounts}
        users={users}
        onBack={() => setSelectedId(null)}
        onAccountChanged={onRefreshAccounts}
        onAccountDeleted={() => { setSelectedId(null); onRefreshAccounts(); }}
      />
    );
  }

  return (
    <div>
      <div className="acct-toolbar">
        <div className="seg">
          <button className={!mineOnly ? 'on' : ''} onClick={() => setMineOnly(false)}>All accounts</button>
          <button className={mineOnly ? 'on' : ''} onClick={() => setMineOnly(true)}>My accounts</button>
        </div>
        <div className="hint" style={{ flex: 1 }}>Every account here is visible to your whole team.</div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>＋ New account</button>
      </div>

      {accounts.length === 0 ? (
        <div className="empty">
          <b>No accounts yet.</b><br />Create your first one — every task you log needs an account to belong to.
        </div>
      ) : visibleAccounts.length === 0 ? (
        <div className="empty">
          <b>No accounts assigned to you.</b><br />You're not the CSM or Account Manager on any account yet.
        </div>
      ) : (
        <div className="acct-grid">
          {visibleAccounts.map(a => <AccountCard key={a.id} account={a} onOpen={setSelectedId} />)}
        </div>
      )}

      {creating && (
        <AccountFormModal
          users={users}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
