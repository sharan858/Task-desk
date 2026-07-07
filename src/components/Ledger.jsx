import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { currentPeriodBtnLabel, periodLabelText, periodWord } from '../utils/period.js';

export default function Ledger({ mainView, periodType, periodOffset, setPeriodType, shiftPeriod, goCurrentPeriod, ring }){
  const { user, logout } = useAuth();
  const showPeriod = mainView === 'tasks';
  const RADIUS = 27;
  const CIRC = 2 * Math.PI * RADIUS;
  const pct = ring?.pct || 0;
  const offset = CIRC * (1 - pct / 100);

  return (
    <div className="ledger">
      <div className="ledger-top">
        <div>
          <div className="brand">Zuper · Account Management</div>
          <h1>TaskDesk</h1>
          <div className="who">
            Signed in as <b>{user?.name}</b>
            <button onClick={logout}>Sign out</button>
          </div>
        </div>
        {showPeriod && (
          <div className="ring-wrap">
            <div className="ring">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="6" />
                <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#7EF0C0" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset .5s ease' }} />
              </svg>
              <div className="pct">{pct}%</div>
            </div>
            <div className="ring-meta">
              <b>{ring?.done || 0}</b> of <b>{ring?.total || 0}</b> tasks<br />finished {periodWord(periodType)}
            </div>
          </div>
        )}
      </div>

      {showPeriod && (
        <div className="weeknav">
          <div className="seg-dark">
            <button className={periodType === 'day' ? 'on' : ''} onClick={() => setPeriodType('day')}>Day</button>
            <button className={periodType === 'week' ? 'on' : ''} onClick={() => setPeriodType('week')}>Week</button>
            <button className={periodType === 'month' ? 'on' : ''} onClick={() => setPeriodType('month')}>Month</button>
          </div>
          <button onClick={() => shiftPeriod(-1)}>‹ Prev</button>
          <span className="weeklabel">{periodLabelText(periodType, periodOffset)}</span>
          <button onClick={() => shiftPeriod(1)}>Next ›</button>
          {periodOffset !== 0 && <button onClick={goCurrentPeriod}>{currentPeriodBtnLabel(periodType)}</button>}
        </div>
      )}
    </div>
  );
}
