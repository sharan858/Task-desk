import React, { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { HEALTHS } from '../utils/period.js';
import AccountCard from '../components/AccountCard.jsx';
import AccountFormModal from '../components/AccountFormModal.jsx';
import AccountDetail from './AccountDetail.jsx';

const NO_FILTERS = {
  search: '',
  health: 'all',
  csm: 'all',
  manager: 'all',
  dealMin: '',
  dealMax: ''
};

export default function AccountView({ accounts, users, onRefreshAccounts }){
  const { user } = useAuth();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [filters, setFilters] = useState(NO_FILTERS);

  const csmOptions = useMemo(() => users.filter(u => u.role === 'csm'), [users]);
  const managerOptions = useMemo(() => users.filter(u => u.role === 'account_manager' || u.role === 'both'), [users]);

  function setFilter(key, value){ setFilters(f => ({ ...f, [key]: value })); }

  const filtersActive = mineOnly || Object.keys(NO_FILTERS).some(k => filters[k] !== NO_FILTERS[k]);

  function clearFilters(){
    setFilters(NO_FILTERS);
    setMineOnly(false);
  }

  const visibleAccounts = useMemo(() => {
    let vis = accounts;
    if(mineOnly){
      vis = vis.filter(a => String(a.owner_id) === String(user.id) || String(a.account_manager_id) === String(user.id));
    }
    if(filters.health !== 'all') vis = vis.filter(a => a.health === filters.health);
    if(filters.csm === 'unassigned') vis = vis.filter(a => !a.owner_id);
    else if(filters.csm !== 'all') vis = vis.filter(a => String(a.owner_id) === filters.csm);
    if(filters.manager === 'unassigned') vis = vis.filter(a => !a.account_manager_id);
    else if(filters.manager !== 'all') vis = vis.filter(a => String(a.account_manager_id) === filters.manager);
    if(filters.dealMin !== ''){
      const min = Number(filters.dealMin);
      vis = vis.filter(a => a.deal_size != null && Number(a.deal_size) >= min);
    }
    if(filters.dealMax !== ''){
      const max = Number(filters.dealMax);
      vis = vis.filter(a => a.deal_size != null && Number(a.deal_size) <= max);
    }
    if(filters.search.trim()){
      const q = filters.search.trim().toLowerCase();
      vis = vis.filter(a => `${a.name} ${a.description} ${a.poc_name} ${a.poc_email}`.toLowerCase().includes(q));
    }
    return vis;
  }, [accounts, mineOnly, filters, user.id]);

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

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search name, description, POC…"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <select value={filters.health} onChange={e => setFilter('health', e.target.value)}>
          <option value="all">All health</option>
          {HEALTHS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
        </select>
        <select value={filters.csm} onChange={e => setFilter('csm', e.target.value)}>
          <option value="all">All CSMs</option>
          <option value="unassigned">Unassigned</option>
          {csmOptions.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </select>
        <select value={filters.manager} onChange={e => setFilter('manager', e.target.value)}>
          <option value="all">All Account Managers</option>
          <option value="unassigned">Unassigned</option>
          {managerOptions.map(u => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </select>
        <input
          type="number" min="0" style={{ width: 110 }}
          placeholder="Min deal size"
          value={filters.dealMin}
          onChange={e => setFilter('dealMin', e.target.value)}
        />
        <input
          type="number" min="0" style={{ width: 110 }}
          placeholder="Max deal size"
          value={filters.dealMax}
          onChange={e => setFilter('dealMax', e.target.value)}
        />
        {filtersActive && <button className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>}
      </div>

      {accounts.length === 0 ? (
        <div className="empty">
          <b>No accounts yet.</b><br />Create your first one — every task you log needs an account to belong to.
        </div>
      ) : visibleAccounts.length === 0 ? (
        <div className="empty">
          <b>Nothing matches.</b><br />Try different filters, or <button className="btn btn-ghost mini" onClick={clearFilters}>clear filters</button>.
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
