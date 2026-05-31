import React, { useEffect, useState } from 'react';
import SpecialNavbar from '../components/SpecialNavbar';
import { buildUrl } from '../config/api';
import './MyEarnings.css';

export default function MyEarnings(){
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    const fetchData = async () => {
      try{
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { if (mounted) { setReferrals([]); setTotal(0); setLoading(false); } return; }
        const res = await fetch(buildUrl('/api/referral/my'), { headers: { Authorization: `Bearer ${token}` } });
        const j = await res.json();
        if (res.ok) { if (mounted) { setReferrals(j.referrals||[]); setTotal(j.total||0); setErrorMsg(''); } } else {
          console.error('Failed to load earnings', j);
          if (mounted) setErrorMsg(j.message || 'Failed to load earnings');
        }
      }catch(e){ console.error(e); if (mounted) setErrorMsg(String(e)); }
      finally { if (mounted) setLoading(false); }
    };

    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => { mounted = false; clearInterval(iv); };
  },[]);

  return (
    <>
      <SpecialNavbar />
      <div className="welcome-container">
        <div className="sub-header">
          <div className="sub-header-inner">
            <div className="greeting">
              <h2>💰 My Earnings</h2>
            </div>
          </div>
        </div>

        <main className="welcome-body earnings-page">
          <div className="earnings-container">
            {/* Total Earnings Card */}
            <div className="earnings-header">
              <div className="total-card">
                <div className="total-label">Total Earned</div>
                <div className="total-amount">₹{Number(total||0).toFixed(2)}</div>
                <div className="total-subtext">From referrals</div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="alert alert-error">
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            {/* Login Required */}
            {!localStorage.getItem('token') && (
              <div className="alert alert-warning">
                <span>ℹ️</span> Please log in to see your earnings.
              </div>
            )}

            {/* Referrals List */}
            {referrals.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">🎯</div>
                <div className="no-data-text">No referral earnings yet</div>
                <div className="no-data-subtext">Start referring friends and earn money!</div>
              </div>
            ) : (
              <div className="referrals-list">
                {referrals.map((r, idx) => {
                  const isOpen = openId === r._id;
                  return (
                    <div key={r._id} className={`referral-item ${isOpen ? 'open' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
                      <button 
                        className="referral-header"
                        onClick={() => setOpenId(isOpen ? null : r._id)}
                      >
                        <div className="referral-info">
                          <div className="referral-name">
                            👤 {r.referred?.name || r.name || r.referredUniqueId}
                          </div>
                          <div className="referral-id">ID: {r.referredUniqueId}</div>
                        </div>
                        <div className="referral-stats">
                          <div className="referral-amount">
                            ₹{Number(r.amount||0).toFixed(2)}
                          </div>
                          <div className={`referral-status ${r.status || 'inactive'}`}>
                            {r.status === 'active' ? '✓ Active' : '○ Inactive'}
                          </div>
                        </div>
                        <div className={`expand-icon ${isOpen ? 'open' : ''}`}>▼</div>
                      </button>

                      {isOpen && (
                        <div className="referral-details">
                          <div className="detail-row">
                            <span className="detail-label">Name:</span>
                            <span className="detail-value">{r.referred?.name || r.name || r.referredUniqueId || '-'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{r.referred?.email || r.email || '-'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Phone:</span>
                            <span className="detail-value">{r.referred?.phone || r.phone || '-'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Earned:</span>
                            <span className="detail-value highlight">₹{Number(r.amount||0).toFixed(2)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">{new Date(r.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
