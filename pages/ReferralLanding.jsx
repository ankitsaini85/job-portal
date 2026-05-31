import React, { useEffect, useState } from 'react';
import SpecialNavbar from '../components/SpecialNavbar';
import { buildUrl } from '../config/api';
import { useNavigate } from 'react-router-dom';

export default function ReferralLanding(){
  const navigate = useNavigate();
  const user = (()=>{ try{ return JSON.parse(localStorage.getItem('user')||'{}'); }catch(e){return{}} })();

  const referralLink = `${window.location.origin}/referral/register?ref=${user?.uniqueId || ''}`;

  const copyLink = async () => {
    try{
      await navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard');
    }catch(e){
      // fallback
      const inp = document.createElement('input'); inp.value = referralLink; document.body.appendChild(inp); inp.select(); document.execCommand('copy'); inp.remove();
      alert('Referral link copied');
    }
  };

  // referrals list state
  const [showList, setShowList] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReferrals = async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Please log in to view your referrals'); setReferrals([]); setLoading(false); return; }
  const res = await fetch(buildUrl('/api/referral/my'), { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) { setError(j.message || 'Failed to load referrals'); setReferrals([]); }
      else setReferrals(j.referrals || []);
    } catch (e) { setError(String(e)); setReferrals([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // when showList toggles on, fetch referrals
    if (showList) fetchReferrals();
    // eslint-disable-next-line
  }, [showList]);

  return (
    <>
      <SpecialNavbar />
      <div className="welcome-container">
        <div className="sub-header">
          <div className="sub-header-inner">
            <div className="greeting">
              <h2>Hello, welcome {user?.name || 'User'}</h2>
              {user?.uniqueId && <div style={{ marginTop: 8, fontSize: 14, color: '#333' }}>Your ID: <strong>{user.uniqueId}</strong></div>}
            </div>

            <div className="top-timer" aria-live="polite">
              <div className="top-timer-label">Referral</div>
              <div style={{ fontSize: 14, color: '#0f172a' }}>Share your referral link</div>
            </div>
          </div>
        </div>

        <main className="welcome-body" style={{ padding: 24, marginTop: -100 }}>
          <div style={{ maxWidth: 840, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 12px 40px rgba(2,6,23,0.06)' }}>
            <h3>Referral</h3>
            <p>Share this referral link with a new user. When they register from this link, the referral will be recorded.</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={referralLink} readOnly style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <button className="btn-primary" onClick={copyLink}>Copy</button>
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center' }}>

              <button className="btn-primary" onClick={() => setShowList(s => !s)}>{showList ? 'Hide referred people' : 'Show referred people'}</button>
            </div>

            {showList && (
              <div style={{ marginTop: 18 }}>
                <h4>Your referrals</h4>
                {loading ? <div>Loading...</div> : null}
                {error ? <div style={{ color: '#b91c1c' }}>{error}</div> : null}
                <div style={{ marginTop: 8, background: '#fff', borderRadius: 8 }}>
                  {(!referrals || referrals.length === 0) ? <div style={{ padding: 12 }}>No referrals yet.</div> : (
                    referrals.map(r => (
                      <div key={r._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight:700 }}>{r.referred?.name || r.name || r.referredUniqueId}</div>
                            <div style={{ color:'#6b7280' }}>{r.referred?.email || r.email || '-'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {/* <div style={{ fontWeight:700 }}>₹{Number(r.amount||0).toFixed(2)}</div> */}
                            <div style={{ color: r.status === 'active' ? '#059669' : '#6b7280' }}>{r.status}</div>
                          </div>
                        </div>
                        <div style={{ padding: 12, background: '#fbfbfd' }}>
                          <div><strong>Phone:</strong> {r.referred?.phone || r.phone || '-'}</div>
                          <div><strong>Recorded:</strong> {new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
