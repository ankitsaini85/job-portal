import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

let idCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, opts = {}) => {
    const id = idCounter++;
    const { type = 'info', duration = 4000 } = opts;
    const t = { id, message, type };
    setToasts((s) => [...s, t]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((s) => s.filter(x => x.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((s) => s.filter(t => t.id !== id));
  }, []);

  const value = { addToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // fallback no-op: allows calls even if provider missing
    return (msg, opts) => {
      try { console.warn('ToastProvider missing. Message:', msg); } catch (e) {}
    };
  }
  return ctx.addToast;
}

export default ToastContext;
