import React, { createContext, useCallback, useContext, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }){
  const [state, setState] = useState(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise(resolve => {
      setState({ message, resolve, danger: opts.danger, confirmLabel: opts.confirmLabel || 'Confirm' });
    });
  }, []);

  function close(result){
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={() => close(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head"><h3>Please confirm</h3></div>
            <div className="modal-body"><p style={{ color: 'var(--ink-soft)' }}>{state.message}</p></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
              <button className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>{state.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(){
  return useContext(ConfirmContext);
}
