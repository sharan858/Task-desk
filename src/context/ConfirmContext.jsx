import React, { createContext, useCallback, useContext, useState } from 'react';
import Modal from '../components/Modal.jsx';

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
        <Modal onClose={() => close(false)} maxWidth={420}>
            <div className="modal-head"><h3>Please confirm</h3></div>
            <div className="modal-body"><p style={{ color: 'var(--ink-soft)' }}>{state.message}</p></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
              <button className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)} autoFocus>{state.confirmLabel}</button>
            </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(){
  return useContext(ConfirmContext);
}
