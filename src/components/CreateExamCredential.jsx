import React, { useState } from 'react';
import { buildUrl } from '../config/api';

export default function CreateExamCredential({ onCreated, adminToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e && e.preventDefault();
    if (!username || !password) return alert('username and password required');
    setLoading(true);
    try {
      const payload = { username, password, label };
      const res = await fetch(buildUrl('/api/admin/exam-credentials'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed');
  setUsername(''); setPassword(''); setLabel('');
      onCreated && onCreated();
    } catch (err) {
      alert(err.message || String(err));
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
  <input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add'}</button>
    </form>
  );
}
