import React, { useEffect, useState } from 'react';
import ExcelJS from 'exceljs';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { HEALTHS, healthLabel, STAGES, stageLabel } from '../utils/period.js';

function downloadWorkbook(workbook, filename){
  return workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

async function parseWorkbook(file){
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if(!ws) return { headerIndex: {}, rowsRaw: [] };

  const headerIndex = {};
  ws.getRow(1).eachCell((cell, colNumber) => {
    const label = String(cell.value || '').trim();
    if(label) headerIndex[label] = colNumber;
  });

  const rowsRaw = [];
  ws.eachRow((row, rowNumber) => {
    if(rowNumber === 1) return;
    rowsRaw.push({ row, rowNumber });
  });
  return { headerIndex, rowsRaw };
}

function cellGetter(headerIndex, row){
  return label => {
    const idx = headerIndex[label];
    if(!idx) return '';
    const v = row.getCell(idx).value;
    return v == null ? '' : v;
  };
}

/* ── Accounts ─────────────────────────────────────── */

const ACCOUNT_COLUMNS = [
  { header: 'Account Name', key: 'name', width: 28 },
  { header: 'CSM', key: 'csm', width: 18 },
  { header: 'Account Manager', key: 'accountManager', width: 18 },
  { header: 'Account Health', key: 'health', width: 14 },
  { header: 'Deal Size', key: 'dealSize', width: 14 },
  { header: 'Point of Contact', key: 'pocName', width: 22 },
  { header: 'POC Email', key: 'pocEmail', width: 26 },
  { header: 'Description', key: 'description', width: 40 }
];

function buildAccountWorkbook(accounts){
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Accounts');
  ws.columns = ACCOUNT_COLUMNS;
  ws.getRow(1).font = { bold: true };
  accounts.forEach(a => {
    ws.addRow({
      name: a.name,
      csm: a.owner_name || '',
      accountManager: a.account_manager_name || '',
      health: healthLabel(a.health),
      dealSize: a.deal_size != null ? Number(a.deal_size) : '',
      pocName: a.poc_name,
      pocEmail: a.poc_email,
      description: a.description || ''
    });
  });
  return wb;
}

const ACCOUNT_SAMPLE_ROWS = [
  {
    name: 'Acme Corp',
    csm: 'Deepak',
    accountManager: 'Jasper',
    health: 'Healthy',
    dealSize: 50000,
    pocName: 'Jane Smith',
    pocEmail: 'jane@acme.com',
    description: 'Sample row — CSM/Account Manager must match an existing user with that role, or leave blank for Unassigned.'
  },
  {
    name: 'Beta Industries',
    csm: '',
    accountManager: '',
    health: 'Neutral',
    dealSize: '',
    pocName: 'Bob Lee',
    pocEmail: 'bob@beta.com',
    description: 'Sample row — CSM, Account Manager and Deal Size can all be left blank.'
  }
];

function buildAccountTemplateWorkbook(){
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Accounts');
  ws.columns = ACCOUNT_COLUMNS;
  ws.getRow(1).font = { bold: true };
  ACCOUNT_SAMPLE_ROWS.forEach(row => ws.addRow(row));
  return wb;
}

async function parseAccountWorkbook(file){
  const { headerIndex, rowsRaw } = await parseWorkbook(file);
  const rows = [];
  for(const { row, rowNumber } of rowsRaw){
    const get = cellGetter(headerIndex, row);
    const name = String(get('Account Name')).trim();
    if(!name) continue;
    rows.push({
      rowNumber,
      name,
      csm: String(get('CSM')).trim(),
      accountManager: String(get('Account Manager')).trim(),
      health: String(get('Account Health')).trim(),
      dealSize: get('Deal Size'),
      pocName: String(get('Point of Contact')).trim(),
      pocEmail: String(get('POC Email')).trim(),
      description: String(get('Description'))
    });
  }
  return rows;
}

function resolveHealth(label){
  const match = HEALTHS.find(h => h.label.toLowerCase() === label.toLowerCase() || h.id.toLowerCase() === label.toLowerCase());
  return match ? match.id : 'healthy';
}

function accountRowToPayload(row, users){
  const csmUser = row.csm ? users.find(u => u.role === 'csm' && u.name.toLowerCase() === row.csm.toLowerCase()) : null;
  const amUser = row.accountManager
    ? users.find(u => (u.role === 'account_manager' || u.role === 'both') && u.name.toLowerCase() === row.accountManager.toLowerCase())
    : null;
  const notes = [];
  if(row.csm && !csmUser) notes.push(`CSM "${row.csm}" not found — left unassigned`);
  if(row.accountManager && !amUser) notes.push(`Account Manager "${row.accountManager}" not found — left unassigned`);

  return {
    payload: {
      name: row.name,
      description: row.description,
      health: row.health ? resolveHealth(row.health) : 'healthy',
      ownerId: csmUser ? csmUser.id : null,
      accountManagerId: amUser ? amUser.id : null,
      pocName: row.pocName,
      pocEmail: row.pocEmail,
      dealSize: row.dealSize === '' ? null : Number(row.dealSize)
    },
    notes
  };
}

function AccountImportExport({ accounts, users, onRefreshAccounts }){
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  async function handleDownloadTemplate(){
    setDownloadingTemplate(true);
    try{
      await downloadWorkbook(buildAccountTemplateWorkbook(), 'taskdesk-account-import-template.xlsx');
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setDownloadingTemplate(false);
    }
  }

  async function handleExport(){
    setExporting(true);
    try{
      const wb = buildAccountWorkbook(accounts);
      await downloadWorkbook(wb, 'taskdesk-accounts.xlsx');
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setExporting(false);
    }
  }

  async function handleImport(e){
    const file = e.target.files[0];
    e.target.value = '';
    if(!file) return;

    setImporting(true);
    setResults(null);
    try{
      const rows = await parseAccountWorkbook(file);
      if(!rows.length){
        toast('No account rows found in that file', 'error');
        return;
      }
      const outcomes = [];
      for(let i = 0; i < rows.length; i++){
        const row = rows[i];
        setProgress({ current: i + 1, total: rows.length });
        const { payload, notes } = accountRowToPayload(row, users);
        try{
          await api.createAccount(payload);
          outcomes.push({ row: row.rowNumber, name: row.name, ok: true, notes });
        }catch(err){
          outcomes.push({ row: row.rowNumber, name: row.name, ok: false, error: err.message });
        }
      }
      setResults(outcomes);
      await onRefreshAccounts();
      const failed = outcomes.filter(o => !o.ok).length;
      toast(failed ? `Imported ${outcomes.length - failed} of ${outcomes.length} accounts` : `Imported ${outcomes.length} accounts`, failed ? 'error' : 'info');
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setImporting(false);
      setProgress(null);
    }
  }

  return (
    <div>
      <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 520 }}>
        <h4>Export accounts</h4>
        <p style={{ marginBottom: 10 }}>Download every account as an Excel file.</p>
        <button className="btn btn-primary" disabled={exporting} onClick={handleExport}>
          {exporting ? 'Preparing…' : `⬇ Export ${accounts.length} account${accounts.length === 1 ? '' : 's'}`}
        </button>
      </div>

      <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 520 }}>
        <h4>Import accounts</h4>
        <p style={{ marginBottom: 10 }}>
          Upload an Excel file with the same columns used to create an account (Account Name, CSM, Account
          Manager, Account Health, Deal Size, Point of Contact, POC Email, Description). CSM and Account
          Manager are matched by name against users who have that role — leave blank for Unassigned.
        </p>
        <button className="btn btn-ghost" disabled={downloadingTemplate} onClick={handleDownloadTemplate} style={{ marginBottom: 12 }}>
          {downloadingTemplate ? 'Preparing…' : '⬇ Download sample template'}
        </button>
        <div className="field">
          <label>Excel file to import</label>
          <input type="file" accept=".xlsx" disabled={importing} onChange={handleImport} />
        </div>
        {importing && (
          <div className="hint" style={{ marginTop: 8 }}>
            {progress ? `Importing ${progress.current} of ${progress.total}…` : 'Reading file…'}
          </div>
        )}
      </div>

      {results && (
        <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 520 }}>
          <h4>Import results</h4>
          <p style={{ marginBottom: 10 }}>
            <b>{results.filter(r => r.ok).length}</b> of <b>{results.length}</b> imported successfully.
          </p>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {results.map(r => (
              <div key={r.row} style={{ fontSize: 13, padding: '4px 0', color: r.ok ? 'inherit' : 'var(--high)' }}>
                Row {r.row} — {r.name || '(blank)'}: {r.ok ? 'Imported' : r.error}
                {r.notes && r.notes.length > 0 && (
                  <div style={{ color: 'var(--ink-faint)' }}>{r.notes.join('; ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tasks ────────────────────────────────────────── */

const TASK_COLUMNS = [
  { header: 'Task', key: 'title', width: 32 },
  { header: 'Account Name', key: 'accountName', width: 26 },
  { header: 'Customer', key: 'customer', width: 20 },
  { header: 'Category', key: 'category', width: 12 },
  { header: 'Priority', key: 'priority', width: 12 },
  { header: 'Stage', key: 'stage', width: 14 },
  { header: 'Due Date', key: 'dueDate', width: 14 },
  { header: 'Description', key: 'description', width: 36 },
  { header: 'Notes', key: 'notes', width: 36 }
];

function buildTaskWorkbook(tasks){
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Tasks');
  ws.columns = TASK_COLUMNS;
  ws.getRow(1).font = { bold: true };
  tasks.forEach(t => {
    ws.addRow({
      title: t.title,
      accountName: t.account_name || '',
      customer: t.customer || '',
      category: t.category,
      priority: t.priority,
      stage: stageLabel(t.stage),
      dueDate: t.due_date || '',
      description: t.description || '',
      notes: t.notes || ''
    });
  });
  return wb;
}

const TASK_SAMPLE_ROWS = [
  {
    title: 'Send renewal quote for FY26–27',
    accountName: 'Acme Corp',
    customer: 'Jane Smith',
    category: 'AM',
    priority: 'High',
    stage: 'Open',
    dueDate: '2026-08-15',
    description: 'Sample row — Account Name must match an existing account exactly.',
    notes: ''
  },
  {
    title: 'Quarterly business review',
    accountName: 'Beta Industries',
    customer: '',
    category: 'CSM',
    priority: 'Medium',
    stage: 'Priority',
    dueDate: '',
    description: 'Sample row — Due Date, Customer, Description and Notes can all be left blank.',
    notes: ''
  }
];

function buildTaskTemplateWorkbook(){
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Tasks');
  ws.columns = TASK_COLUMNS;
  ws.getRow(1).font = { bold: true };
  TASK_SAMPLE_ROWS.forEach(row => ws.addRow(row));
  return wb;
}

function toDateInputValue(v){
  if(!v) return '';
  if(v instanceof Date) return v.toISOString().slice(0, 10);
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

async function parseTaskWorkbook(file){
  const { headerIndex, rowsRaw } = await parseWorkbook(file);
  const rows = [];
  for(const { row, rowNumber } of rowsRaw){
    const get = cellGetter(headerIndex, row);
    const title = String(get('Task')).trim();
    if(!title) continue;
    rows.push({
      rowNumber,
      title,
      accountName: String(get('Account Name')).trim(),
      customer: String(get('Customer')).trim(),
      category: String(get('Category')).trim(),
      priority: String(get('Priority')).trim(),
      stage: String(get('Stage')).trim(),
      dueDate: toDateInputValue(get('Due Date')),
      description: String(get('Description')),
      notes: String(get('Notes'))
    });
  }
  return rows;
}

function resolveStage(label){
  const match = STAGES.find(s => s.label.toLowerCase() === label.toLowerCase() || s.id.toLowerCase() === label.toLowerCase());
  return match ? match.id : 'open';
}

function taskRowToPayload(row, accounts){
  const account = row.accountName ? accounts.find(a => a.name.toLowerCase() === row.accountName.toLowerCase()) : null;
  const notes = [];
  if(!account) notes.push(`Account "${row.accountName}" not found`);

  return {
    payload: account ? {
      accountId: account.id,
      title: row.title,
      customer: row.customer,
      category: row.category === 'CSM' ? 'CSM' : 'AM',
      priority: ['High', 'Medium', 'Low'].includes(row.priority) ? row.priority : 'Medium',
      stage: row.stage ? resolveStage(row.stage) : 'open',
      dueDate: row.dueDate || null,
      description: row.description,
      notes: row.notes
    } : null,
    notes
  };
}

function TaskImportExport({ accounts }){
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  async function loadTasks(){
    setLoadingTasks(true);
    try{
      const { tasks } = await api.tasks();
      setTasks(tasks);
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setLoadingTasks(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function handleDownloadTemplate(){
    setDownloadingTemplate(true);
    try{
      await downloadWorkbook(buildTaskTemplateWorkbook(), 'taskdesk-task-import-template.xlsx');
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setDownloadingTemplate(false);
    }
  }

  async function handleExport(){
    setExporting(true);
    try{
      const wb = buildTaskWorkbook(tasks);
      await downloadWorkbook(wb, 'taskdesk-tasks.xlsx');
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setExporting(false);
    }
  }

  async function handleImport(e){
    const file = e.target.files[0];
    e.target.value = '';
    if(!file) return;
    if(!accounts.length){
      toast('Create at least one account before importing tasks', 'error');
      return;
    }

    setImporting(true);
    setResults(null);
    try{
      const rows = await parseTaskWorkbook(file);
      if(!rows.length){
        toast('No task rows found in that file', 'error');
        return;
      }
      const outcomes = [];
      for(let i = 0; i < rows.length; i++){
        const row = rows[i];
        setProgress({ current: i + 1, total: rows.length });
        const { payload, notes } = taskRowToPayload(row, accounts);
        if(!payload){
          outcomes.push({ row: row.rowNumber, name: row.title, ok: false, error: notes.join('; ') });
          continue;
        }
        try{
          await api.createTask(payload);
          outcomes.push({ row: row.rowNumber, name: row.title, ok: true, notes });
        }catch(err){
          outcomes.push({ row: row.rowNumber, name: row.title, ok: false, error: err.message });
        }
      }
      setResults(outcomes);
      await loadTasks();
      const failed = outcomes.filter(o => !o.ok).length;
      toast(failed ? `Imported ${outcomes.length - failed} of ${outcomes.length} tasks` : `Imported ${outcomes.length} tasks`, failed ? 'error' : 'info');
    }catch(err){
      toast(err.message, 'error');
    }finally{
      setImporting(false);
      setProgress(null);
    }
  }

  return (
    <div>
      <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 520 }}>
        <h4>Export tasks</h4>
        <p style={{ marginBottom: 10 }}>Download every task as an Excel file.</p>
        <button className="btn btn-primary" disabled={exporting || loadingTasks} onClick={handleExport}>
          {exporting ? 'Preparing…' : loadingTasks ? 'Loading…' : `⬇ Export ${tasks.length} task${tasks.length === 1 ? '' : 's'}`}
        </button>
      </div>

      <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 520 }}>
        <h4>Import tasks</h4>
        <p style={{ marginBottom: 10 }}>
          Upload an Excel file with the same columns used to create a task (Task, Account Name, Customer,
          Category, Priority, Stage, Due Date, Description, Notes). Account Name must match an existing
          account exactly.
        </p>
        <button className="btn btn-ghost" disabled={downloadingTemplate} onClick={handleDownloadTemplate} style={{ marginBottom: 12 }}>
          {downloadingTemplate ? 'Preparing…' : '⬇ Download sample template'}
        </button>
        <div className="field">
          <label>Excel file to import</label>
          <input type="file" accept=".xlsx" disabled={importing} onChange={handleImport} />
        </div>
        {importing && (
          <div className="hint" style={{ marginTop: 8 }}>
            {progress ? `Importing ${progress.current} of ${progress.total}…` : 'Reading file…'}
          </div>
        )}
      </div>

      {results && (
        <div className="acct-info-card" style={{ marginTop: 16, maxWidth: 520 }}>
          <h4>Import results</h4>
          <p style={{ marginBottom: 10 }}>
            <b>{results.filter(r => r.ok).length}</b> of <b>{results.length}</b> imported successfully.
          </p>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {results.map(r => (
              <div key={r.row} style={{ fontSize: 13, padding: '4px 0', color: r.ok ? 'inherit' : 'var(--high)' }}>
                Row {r.row} — {r.name || '(blank)'}: {r.ok ? 'Imported' : r.error}
                {r.notes && r.notes.length > 0 && (
                  <div style={{ color: 'var(--ink-faint)' }}>{r.notes.join('; ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────── */

export default function ImportExport({ accounts, users, onRefreshAccounts }){
  const [tab, setTab] = useState('accounts');

  return (
    <div>
      <div className="toolbar" style={{ marginTop: 16 }}>
        <div className="seg">
          <button className={tab === 'accounts' ? 'on' : ''} onClick={() => setTab('accounts')}>Accounts</button>
          <button className={tab === 'tasks' ? 'on' : ''} onClick={() => setTab('tasks')}>Tasks</button>
        </div>
      </div>

      {tab === 'accounts' ? (
        <AccountImportExport accounts={accounts} users={users} onRefreshAccounts={onRefreshAccounts} />
      ) : (
        <TaskImportExport accounts={accounts} />
      )}
    </div>
  );
}
