import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { buildUrl } from '../config/api';
import { useToast } from '../components/ToastContext';
import companyLogo from '../images/company-logo.png';

const SpecialNavbar = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [name, setName] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.name || u?.email || null;
    } catch (e) {
      return null;
    }
  });

  // sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [account, setAccount] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.accountDetails || null; } catch (e) { return null; }
  });
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctFormOpen, setAcctFormOpen] = useState(false);
  const [acctMode, setAcctMode] = useState('add'); // 'add' | 'update'
  const [acctForm, setAcctForm] = useState({ holderName: '', bankName: '', accountNumber: '', ifsc: '', branch: '', upiId: '' });
  const [acctMsg, setAcctMsg] = useState('');
  const [acctToast, setAcctToast] = useState('');
  const [sidebarReferrals, setSidebarReferrals] = useState([]);
  const [referralsOpen, setReferralsOpen] = useState(false);
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") {
        setLoggedIn(!!localStorage.getItem("token"));
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          setName(u?.name || u?.email || null);
        } catch (err) {
          setName(null);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    // when sidebar opens, try refresh account from localStorage or API
    if (!sidebarOpen) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(buildUrl('/api/auth/account'), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const j = await res.json();
        setAccount(j.accountDetails || null);
      } catch (e) { /* ignore */ }
    })();
    // fetch referrals for sidebar
    (async () => {
      try {
        const t = localStorage.getItem('token');
        if (!t) return;
        const r = await fetch(buildUrl('/api/referral/my'), { headers: { Authorization: `Bearer ${t}` } });
        if (!r.ok) return;
        const body = await r.json();
        setSidebarReferrals(body.referrals || []);
      } catch (e) { /* ignore */ }
    })();
  }, [sidebarOpen]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // clear any special-job timer keys for this session so timer resets on next login
        try {
          const toRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith('specialJobStartTs')) toRemove.push(k);
          }
          toRemove.forEach(k => sessionStorage.removeItem(k));
        } catch (e) {
          // ignore sessionStorage errors
        }
    } catch (e) {}
    setLoggedIn(false);
    setName(null);
    navigate("/");
  };

  const openAddForm = () => {
    setAcctMode('add');
    setAcctForm({ holderName: '', bankName: '', accountNumber: '', ifsc: '', branch: '', upiId: '' });
    setAcctMsg('');
    setAcctFormOpen(true);
    setAcctOpen(true);
  };

  const openUpdateForm = () => {
    setAcctMode('update');
    setAcctForm(account || { holderName: '', bankName: '', accountNumber: '', ifsc: '', branch: '', upiId: '' });
    setAcctMsg('');
    setAcctFormOpen(true);
    setAcctOpen(true);
  };

  const handleAcctChange = (e) => setAcctForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submitAcctForm = async (e) => {
    e && e.preventDefault();
    setAcctMsg('');
    const token = localStorage.getItem('token');
    if (!token) return setAcctMsg('Login required');
    if (!acctForm.holderName || !acctForm.accountNumber || (!acctForm.ifsc && !acctForm.upiId)) return setAcctMsg('Fill holder, account and IFSC or UPI');
    try {
  const method = acctMode === 'add' ? 'POST' : 'PUT';
  const res = await fetch(buildUrl('/api/auth/account'), { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(acctForm) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || 'Failed');
      setAccount(j.accountDetails || null);
      try { const u = JSON.parse(localStorage.getItem('user') || '{}'); u.accountDetails = j.accountDetails; localStorage.setItem('user', JSON.stringify(u)); } catch (e) {}
      setAcctFormOpen(false);
      setAcctMsg('Saved');
      // show toast briefly
      const toastText = acctMode === 'add' ? 'Account details added' : 'Account details updated';
      setAcctToast(toastText);
      setTimeout(() => setAcctToast(''), 3000);
    } catch (err) { setAcctMsg(err.message || 'Error'); }
  };

  return (
    <>
  <nav className="special-navbar">
        <div className="nav-left">
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
        </div>

        <div className="nav-center">
          {/* <Link to="/" className="navbar-brand"> */}
            <img src={companyLogo} alt="Company logo" className="navbar-logo" />
          {/* </Link> */}
        </div>

        <div className="nav-right">
          {!loggedIn ? (
            <Link to="/login">
              <button>Login</button>
            </Link>
          ) : (
            <>
              <span style={{ marginRight: 12 }}>Hi{ name ? `, ${name}` : '' }</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </nav>

      {/* Sidebar overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-hidden={!sidebarOpen}>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">×</button>
        <ul>
          
          <li>
            <div className="sidebar-account">
              <button className="sidebar-account-toggle" onClick={() => { setAcctOpen(v => !v); setSidebarOpen(true); }}>
                <span>Account Details</span>
                <span className="acct-preview">{account ? `${account.holderName} · ${account.bankName}` : ''}</span>
              </button>

              <div className={`account-dropdown ${acctOpen ? 'open' : ''}`}>
                <div className="account-actions-row">
                  <button className="btn-outline" onClick={() => { openAddForm(); }} disabled={!!account}>Add Details</button>
                  <button className="btn-primary" onClick={() => { openUpdateForm(); }} disabled={!account}>Update Details</button>
                </div>
              </div>
            </div>
          </li>
          {/* <li><Link to="/details" onClick={() => setSidebarOpen(false)}>Details</Link></li> */}
          <li><Link to="/welcome" onClick={() => setSidebarOpen(false)}>Home</Link></li>
          <li><Link to="/wallet-transfer" onClick={() => setSidebarOpen(false)}>My Wallet</Link></li>
          <li><Link to="/referral" onClick={() => setSidebarOpen(false)}>My Referral</Link></li>
          <li>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link to="/earnings" onClick={() => setSidebarOpen(false)}>My Earnings</Link>
              <button className="btn-outline" onClick={() => setReferralsOpen(s => !s)} style={{ padding: '4px 8px', fontSize: 12 }}>{referralsOpen ? 'Hide' : 'Show'}</button>
            </div>
            {referralsOpen && (
              <div style={{ marginTop: 8, paddingLeft: 8 }}>
                {sidebarReferrals.length === 0 ? <div style={{ color: '#6b7280', fontSize: 13 }}>No referrals</div> : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {sidebarReferrals.map(r => (
                      <li key={r._id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: 13 }}>{r.referred?.name || r.name || r.referredUniqueId}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{r.referred?.email || r.email || '-'}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
          <li><Link to="/bonus" onClick={() => setSidebarOpen(false)}>Bonus</Link></li>
          {/* Show Work Page button only when on Wallet Transfer page */}
          {location && location.pathname === '/wallet-transfer' && (
            <li>
              <button
                className="sidebar-link-like"
                onClick={async () => {
                  setSidebarOpen(false);
                  const token = localStorage.getItem('token');
                  if (!token) {
                    toast('Please login to continue', { type: 'error' });
                    return navigate('/login');
                  }
                  try {
                    const res = await fetch(buildUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) {
                      const data = await res.json().catch(() => ({}));
                      const u = data.user || JSON.parse(localStorage.getItem('user') || '{}');
                      const walletAmount = Number((u && typeof u.wallet === 'number' ? u.wallet : 0) || 0);
                      const required = 5000;
                      if (walletAmount < required) {
                        const amountToAdd = Number((required - walletAmount).toFixed(2));
                        return navigate('/add-amount', { state: { required, amountToAdd, job: { jobId: 'loan-mortgage', title: 'Loan & Mortgage' } } });
                      }
                    }
                  } catch (e) {
                    // ignore and fall through to navigate
                  }
                  navigate('/special-job');
                }}
              >
                Work Page
              </button>
            </li>
          )}
          <li><button onClick={() => { handleLogout(); setSidebarOpen(false); }}>Logout</button></li>
        </ul>
      </aside>
      {/* Account modal (global) */}
      {acctFormOpen && (
        <div className="global-modal-overlay" onClick={() => setAcctFormOpen(false)}>
          <div className="global-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 style={{ marginTop: 0 }}>{acctMode === 'add' ? 'Add Account Details' : 'Update Account Details'}</h3>
            <form onSubmit={submitAcctForm} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input name="holderName" placeholder="Account holder (required)" value={acctForm.holderName} onChange={handleAcctChange} />
              <input name="bankName" placeholder="Bank name" value={acctForm.bankName} onChange={handleAcctChange} />
              <input name="accountNumber" placeholder="Account number (required)" value={acctForm.accountNumber} onChange={handleAcctChange} />
              <input name="ifsc" placeholder="IFSC" value={acctForm.ifsc} onChange={handleAcctChange} />
              <input name="upiId" placeholder="UPI ID (optional)" value={acctForm.upiId} onChange={handleAcctChange} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn-outline" onClick={() => setAcctFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{acctMode === 'add' ? 'Save' : 'Update'}</button>
              </div>
              {acctMsg && <div style={{ marginTop: 8, color: acctMsg === 'Saved' ? '#059669' : '#b91c1c' }}>{acctMsg}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {acctToast && (
        <div className="account-toast" role="status">{acctToast}</div>
      )}
    </>
  );
};

export default SpecialNavbar;
