import React, { useEffect } from 'react';

export default function Modal({ onClose, children, maxWidth }){
  useEffect(() => {
    function onKeyDown(e){
      if(e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={maxWidth ? { maxWidth } : undefined} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
