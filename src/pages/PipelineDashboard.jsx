import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import { healthLabel } from '../utils/period.js';

function money(n){
  return `$${Number(n || 0).toLocaleString()}`;
}

function GroupTable({ title, rows, nameHeader, nameOf }){
  return (
    <div className="acct-info-card" style={{ marginTop: 16 }}>
      <h4>{title}</h4>
      {rows.length === 0 ? (
        <p>No data yet.</p>
      ) : (
        <div className="pipeline-table-wrap">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>{nameHeader}</th>
                <th>Accounts</th>
                <th>Pipeline value</th>
                <th>Overdue tasks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{nameOf(r)}</td>
                  <td>{r.account_count}</td>
                  <td>{money(r.pipeline_value)}</td>
                  <td>{r.overdue_count > 0 ? <span className="warn">{r.overdue_count}</span> : r.overdue_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PipelineDashboard(){
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try{
        const summary = await api.pipelineSummary();
        setData(summary);
      }catch(err){
        toast(err.message, 'error');
      }finally{
        setLoading(false);
      }
    })();
  }, []);

  if(loading || !data) return <div className="spinner" />;

  const { byCsm, byManager, byHealth, totals } = data;

  return (
    <div>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 16 }}>
        <div className="stat">
          <div className="n">{money(totals.pipeline_value)}</div>
          <div className="l">Total pipeline value</div>
        </div>
        <div className="stat">
          <div className="n">{totals.account_count}</div>
          <div className="l">Accounts</div>
        </div>
        <div className="stat" style={totals.overdue_count > 0 ? { borderTopColor: 'var(--high)' } : undefined}>
          <div className="n">{totals.overdue_count}</div>
          <div className="l">Overdue tasks</div>
        </div>
      </div>

      <GroupTable title="Pipeline by CSM" rows={byCsm} nameHeader="CSM" nameOf={r => r.name} />
      <GroupTable title="Pipeline by Account Manager" rows={byManager} nameHeader="Account Manager" nameOf={r => r.name} />
      <GroupTable title="Pipeline by Health" rows={byHealth} nameHeader="Health" nameOf={r => healthLabel(r.health)} />
    </div>
  );
}
