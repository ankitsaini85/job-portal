import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildUrl } from '../config/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const id = searchParams.get('id') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !id) {
      setStatus('invalid');
    }
  }, [token, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setStatus('short');
    if (password !== confirm) return setStatus('mismatch');
    setStatus('loading');
    try {
      const res = await fetch(buildUrl('/api/auth/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setStatus('success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setStatus('error');
    }
  };

  if (status === 'invalid') return <div style={{ padding: 20 }}>Invalid reset link.</div>;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="New password" required />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Confirm password" required />
          <button type="submit">Set Password</button>
        </form>
        {status === 'short' && <p>Password must be at least 8 characters.</p>}
        {status === 'mismatch' && <p>Passwords do not match.</p>}
        {status === 'success' && <p>Password updated — redirecting to login...</p>}
        {status === 'error' && <p>Invalid or expired token, or server error.</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
