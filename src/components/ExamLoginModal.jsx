import React, { useEffect, useRef, useState } from 'react';
import { buildUrl } from '../config/api';
import { useNavigate } from 'react-router-dom';

export default function ExamLoginModal({ open, onClose, toast }) {
  // stable hooks (always invoked) to avoid hook-order mismatch
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledStart, setScheduledStart] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const countdownRef = useRef(null);
  const navigate = useNavigate();

  // submit handler
  const submit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(buildUrl('/api/exam/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403 && body.startAt) {
          const d = new Date(body.startAt);
          setScheduledStart(d);
          setRemainingMs(Math.max(0, d.getTime() - Date.now()));
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = setInterval(() => setRemainingMs(Math.max(0, d.getTime() - Date.now())), 1000);
          return;
        }
        throw new Error(body.message || 'Login failed');
      }

      const token = body.sessionToken;
      try { localStorage.setItem('examSession', token); } catch (e) {}
      try { localStorage.setItem('examSessionInfo', JSON.stringify({ startedAt: body.startedAt, expiresAt: body.expiresAt })); } catch (e) {}
      onClose && onClose();
      navigate('/exam');
    } catch (err) {
      if (toast) toast(err.message || 'Login failed', { type: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  function formatRemaining(ms) {
    if (ms <= 0) return 'Starting now';
    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / (3600 * 24));
    const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const parts = [];
    if (days > 0) parts.push(`${days} day${days>1?'s':''}`);
    if (hours > 0) parts.push(`${hours} hour${hours>1?'s':''}`);
    parts.push(`${String(mins).padStart(2,'0')}m`);
    parts.push(`${String(secs).padStart(2,'0')}s`);
    return parts.join(' ');
  }

  // always mounted; control visibility via style to avoid hook-order issues
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, display: open ? 'flex' : 'none', background: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: 20, borderRadius: 12, width: 360, maxWidth: '92%', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
        <h3 style={{ marginTop: 0 }}>Exam Login</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {!scheduledStart ? (
            <>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Exam ID" required />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
            </>
          ) : (
            <div style={{ padding: 12, borderRadius: 8, background: '#f4f7fb', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>This exam will start soon</div>
              <div style={{ fontSize: 14, color: '#333' }}>{scheduledStart.toLocaleString()}</div>
              <div style={{ marginTop: 10, fontSize: 16, fontWeight: 700 }}>{formatRemaining(remainingMs)}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-outline" onClick={() => { setScheduledStart(null); onClose && onClose(); }}>Cancel</button>
            <button className="btn-primary" type="submit" disabled={loading || Boolean(scheduledStart)}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
