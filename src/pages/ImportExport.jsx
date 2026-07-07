import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { HEALTHS, healthLabel } from '../utils/period.js';

const COLUMNS = [
  { header: 'Account Name', key: 'name', width: 28 },
  { header: 'CSM', key: 'csm', width: 18 },
  { header: 'Account Manager', key: 'accountManager', width: 18 },
  { header: 'Account Health', key: 'health', width: 14 },
  { header: 'Deal Size', key: 'dealSize', width: 14 },
  { header: 'Point of Contact', key: 'pocName', width: 22 },
  { header: 'POC Email', key: 'pocEmail', width: 26 },
  { header: 'Description', key: 'description', width: 40 }
];

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

function buildWorkbook(accounts){
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Accounts');
  ws.columns = COLUMNS;
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

async function parseWorkbook(file){
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if(!ws) return [];

  const headerIndex = {};
  ws.getRow(1).eachCell((cell, colNumber) => {
    const label = String(cell.value || '').trim();
    if(label) headerIndex[label] = colNumber;
  });

  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if(rowNumber === 1) return;
    const get = label => {
      const idx = headerIndex[label];
      if(!idx) return '';
      const v = row.getCell(idx).value;
      return v == null ? '' : v;
    };
    const name = String(get('Account Name')).trim();
    if(!name) return;
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
  });
  return rows;
}

function resolveHealth(label){
  const match = HEALTHS.find(h => h.label.toLowerCase() === label.toLowerCase() || h.id.toLowerCase() === label.toLowerCase());
  return match ? match.id : 'healthy';
}

function rowToPayload(row, users){
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

export default function ImportExport({ accounts, users, onRefreshAccounts }){
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  async function handleExport(){
    setExporting(true);
    try{
      const wb = buildWorkbook(accounts);
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
      const rows = await parseWorkbook(file);
      if(!rows.length){
        toast('No account rows found in that file', 'error');
        return;
      }
      const outcomes = [];
      for(let i = 0; i < rows.length; i++){
        const row = rows[i];
        setProgress({ current: i + 1, total: rows.length });
        const { payload, notes } = rowToPayload(row, users);
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
          Upload an Excel file with the same columns as the export (Account Name, CSM, Account Manager,
          Account Health, Deal Size, Point of Contact, POC Email, Description). Export an empty file first
          to use as a template. CSM and Account Manager are matched by name against users who have that role.
        </p>
        <input type="file" accept=".xlsx" disabled={importing} onChange={handleImport} />
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
