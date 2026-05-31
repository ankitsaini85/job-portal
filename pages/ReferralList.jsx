import React, { useEffect, useState } from 'react';
import SpecialNavbar from '../components/SpecialNavbar';
import { buildUrl } from '../config/api';

export default function ReferralList(){
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(()=>{
    let mounted = true;
    const fetchData = async () => {
      try{
        const token = localStorage.getItem('token');
        if (!token) { if (mounted) { setList([]); setTotal(0); } return; }
  const res = await fetch(buildUrl('/api/referral/my'), { headers: { Authorization: `Bearer ${token}` } });
        const j = await res.json();
        if (res.ok) { if (mounted) { setList(j.referrals||[]); setTotal(j.total||0); setErrorMsg(''); } } else {
          console.error('Failed to load referrals', j);
          if (mounted) setErrorMsg(j.message || 'Failed to load referrals');
        }
      }catch(e){ console.error(e); if (mounted) setErrorMsg(String(e)); }
    };

    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  },[]);

  return (
    <>
      <SpecialNavbar />
      <div className="welcome-container">
        <div className="sub-header"><div className="sub-header-inner"><div className="greeting"><h2>My Referrals</h2></div></div></div>
        <main className="welcome-body" style={{ padding: 24 }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ marginBottom: 12 }}><strong>Total credited from active referrals:</strong> ₹{Number(total||0).toFixed(2)}</div>
            {!localStorage.getItem('token') && <div style={{ color: '#b91c1c', marginBottom: 12 }}>Please log in to see your referrals.</div>}
            <div style={{ background:'#fff', padding:12, borderRadius:8 }}>
              {errorMsg ? <div style={{ color: '#b91c1c', marginBottom: 8 }}>{errorMsg}</div> : null}
              {list.length === 0 ? <div>No referrals yet.</div> : (
                list.map(r => {
                  const isOpen = openId === r._id;
                  return (
                    <div key={r._id} style={{ borderBottom:'1px solid #f3f4f6' }}>
                      <button onClick={() => setOpenId(isOpen ? null : r._id)} style={{ width: '100%', textAlign: 'left', padding:12, background:'transparent', border:0, display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
                        <div>
                          <div style={{ fontWeight:700 }}>{r.referred?.name || r.name || r.referredUniqueId}</div>
                          <div style={{ color:'#6b7280' }}>ID: {r.referredUniqueId}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:700 }}>₹{Number(r.amount||0).toFixed(2)}</div>
                          <div style={{ color: r.status === 'active' ? '#059669' : '#6b7280' }}>{r.status}</div>
                        </div>
                      </button>
                      {isOpen && (
                        <div style={{ padding: 12, background: '#fbfbfd' }}>
                          <div><strong>Name:</strong> {r.referred?.name || r.name || r.referredUniqueId || '-'}</div>
                          <div><strong>Email:</strong> {r.referred?.email || r.email || '-'}</div>
                          <div><strong>Phone:</strong> {r.referred?.phone || r.phone || '-'}</div>
                          <div><strong>Recorded:</strong> {new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
