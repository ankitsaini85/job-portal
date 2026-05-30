import React, { useEffect, useRef, useState } from 'react';
import { buildUrl } from '../config/api';

export default function ChatPanel({ open, onClose, userName, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const pollRef = useRef(null);
  const listRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(buildUrl('/api/messages'));
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      // scroll to bottom after a tick
      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 40);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [open]);

  const send = async () => {
    const txt = (input || '').toString().trim();
    if (!txt) return;
    setSending(true);
    try {
      const body = { message: txt, userName: userName || 'Guest', userId: userId || '' };
      const res = await fetch(buildUrl('/api/messages'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Send failed');
      setInput('');
      await fetchMessages();
    } catch (err) {
      // optionally show error
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 20, width: 360, maxWidth: '92%', zIndex: 120 }}>
      <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
        <div style={{ background: '#0b74ff', color: '#fff', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Site Chat</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline" onClick={() => { setMessages([]); }} style={{ background: 'transparent', color: '#fff' }}>Clear view</button>
            <button className="btn-outline" onClick={onClose} style={{ background: 'transparent', color: '#fff' }}>Close</button>
          </div>
        </div>
        <div style={{ background: '#fff', maxHeight: 360, minHeight: 120, overflowY: 'auto', padding: 12 }} ref={listRef}>
          {messages.length === 0 ? (
            <div className="muted">No messages yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((m) => (
                <div key={m._id} style={{ padding: 8, borderRadius: 8, background: '#f3f4f6' }}>
                  <div style={{ fontWeight: 700 }}>{m.userName || 'Guest'} <small style={{ color: '#6b7280', fontWeight: 600 }}>#{m.userId || '—'}</small></div>
                  <div style={{ marginTop: 6 }}>{m.message}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 10, background: '#fff', borderTop: '1px solid #eee' }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
          <button className="btn-primary" onClick={send} disabled={sending} style={{ padding: '8px 12px' }}>{sending ? 'Sending...' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
}
