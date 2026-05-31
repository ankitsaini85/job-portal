import React, { useEffect, useState } from 'react';
import SpecialNavbar from '../components/SpecialNavbar';
import './Welcome.css';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import { buildUrl } from '../config/api';
import IDCardGenerator from '../components/IDCardGenerator';
import WalletBadge from '../components/WalletBadge';

export default function WalletTransfer(){
  const navigate = useNavigate();
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')||'{}'); } catch(e){ return {}; } });
  const [wallet, setWallet] = useState(() => user?.wallet || 0);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [minTransfer, setMinTransfer] = useState(100);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', message }
  const [confirm, setConfirm] = useState(null); // { amt, fee, total, newBalance, toId }

  useEffect(() => {
    // fetch minTransfer from server
    (async ()=>{
      try{
        const res = await fetch(buildUrl('/api/admin/settings'));
        if (!res.ok) return;
        const data = await res.json();
        if (data && typeof data.minTransferAmount === 'number') setMinTransfer(data.minTransferAmount);
      }catch(e){}
    })();
  }, []);

  const addToast = useToast();

  // bank transfer UI state
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankAmount, setBankAmount] = useState('');
  const [bankAccount, setBankAccount] = useState(null);
  const [bankBusy, setBankBusy] = useState(false);
  const [bankConfirm, setBankConfirm] = useState(null);

  useEffect(()=>{
    setUser(() => { try { return JSON.parse(localStorage.getItem('user')||'{}'); } catch(e){ return {}; } });
    try{ const u = JSON.parse(localStorage.getItem('user')||'{}'); setWallet(u?.wallet||0);}catch(e){}
  },[]);
  const [showIdCard, setShowIdCard] = useState(false);
  const openIdCard = () => setShowIdCard(true);
  const closeIdCard = () => setShowIdCard(false);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  const res = await fetch(buildUrl('/api/transfer/history'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const j = await res.json();
      setHistory(j.transfers || []);
    } catch (e) {
      // ignore
    }
  };

  const handleToggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next) await fetchHistory();
  };

  const fetchAccountDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  const res = await fetch(buildUrl('/api/auth/account'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const j = await res.json();
      setBankAccount(j.accountDetails || null);
    } catch (e) {
      // ignore
    }
  };

  const toggleBank = async () => {
    const next = !showBankForm;
    setShowBankForm(next);
    if (next) await fetchAccountDetails();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
  if (!/^[0-9]{5}$/.test(toId)) { setToast({ type: 'error', message: 'Recipient ID must be 5 digits' }); return; }
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt <= 0) { setToast({ type: 'error', message: 'Enter a valid amount' }); return; }
  if (amt < minTransfer) { setToast({ type: 'error', message: `Minimum amount is ₹${minTransfer}` }); return; }

    setBusy(true);
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(buildUrl('/api/transfer'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUniqueId: toId, amount: amt, message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Transfer failed');
  // update local user wallet
  const updated = { ...(user||{}), wallet: data.from.wallet };
  localStorage.setItem('user', JSON.stringify(updated));
  setWallet(data.from.wallet);
      // show detailed confirmation including fee and total deducted (use confirm card)
      const fee = Number(data.fee).toFixed(2);
      const total = Number(data.totalDebit ?? (amt + Number(data.fee))).toFixed(2);
      setConfirm({ amt: amt.toFixed(2), fee, total, newBalance: Number(data.from.wallet).toFixed(2), toId });
      // clear inputs
      setToId(''); setAmount(''); setMessage('');
    }catch(err){
      setToast({ type: 'error', message: err.message || String(err) });
    }finally{ setBusy(false); }
  };

  const onBankSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(bankAmount);
    if (Number.isNaN(amt) || amt <= 0) { addToast('Enter a valid amount', { type: 'error' }); return; }
    // fetch minBankTransfer
    try {
  const resS = await fetch(buildUrl('/api/admin/settings'));
      if (!resS.ok) throw new Error('Failed to read settings');
      const sdata = await resS.json();
      const minBank = (sdata && typeof sdata.minBankTransfer === 'number') ? sdata.minBankTransfer : 500;
      if (amt < minBank) { addToast(`Minimum bank transfer amount is ₹${minBank}`, { type: 'error' }); return; }
    } catch (err) {
      // continue with default
    }

    if (!bankAccount) { addToast('No account details configured. Please add account details first.', { type: 'error' }); return; }

    setBankBusy(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(buildUrl('/api/transfer/bank-request'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      // show confirmation overlay with fee and amount
      const fee = Number(data.fee).toFixed(2);
      const net = Number(data.net).toFixed(2);
      setBankConfirm({ amount: Number(data.amount).toFixed(2), fee, net });
      setBankAmount('');
      addToast(`Bank transfer request submitted for ₹${data.amount}`, { type: 'success' });
    } catch (err) {
      addToast(err.message || String(err), { type: 'error' });
    } finally { setBankBusy(false); }
  };

  return (
    <>
      <SpecialNavbar />
      <div className="welcome-container">
        <div className="sub-header">
          <div className="sub-header-inner">
            <div className="greeting">
              <h2>Hello, welcome {user?.name || 'User'}</h2>
              {/* {user?.uniqueId && <div className="id-badge"><span className="id-label">ID</span><strong className="id-value">{user.uniqueId}</strong></div>} */}
              {user?.uniqueId && (
                <div
                  className="id-badge"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); openIdCard(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openIdCard(); } }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="id-label">ID</span>
                  <strong className="id-value">{user.uniqueId}</strong>
                </div>
              )}
              <WalletBadge wallet={wallet} onClick={()=>navigate('/wallet-transfer')} />
            </div>

            <div className="top-timer" aria-live="polite">
              <div className="top-timer-label">Wallet Transfer</div>
              <div style={{ fontSize: 14, color: '#0f172a' }}>Send funds to another user</div>
            </div>

            
          </div>
        </div>

        <main className="welcome-body" style={{ padding: 24 }}>
            <div style={{ maxWidth: 840, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 12px 40px rgba(2,6,23,0.06)' ,marginTop: -300 }}>
            <h3
              className="transfer-header"
              onClick={() => setShowForm(s => !s)}
              aria-expanded={showForm}
            >
              <span>Wallet to Wallet Transfer</span>
              <span className="transfer-caret">{showForm ? '▾' : '▸'}</span>
            </h3>
            <p style={{ color: '#6b7280' }}>Enter the recipient's 5-digit ID, amount (minimum ₹{minTransfer}), and an optional message. A convenience fee of 2% will be applied to the sender.</p>

            <div style={{ overflow: 'hidden', transition: 'max-height 260ms ease', maxHeight: showForm ? 800 : 0 }}>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, paddingTop: showForm ? 12 : 0 }}>
              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Recipient ID
                <input value={toId} onChange={e=>setToId(e.target.value.replace(/[^0-9]/g, ''))} maxLength={5} placeholder="12345" style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Amount (₹)
                <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount" type="number" step="0.01" style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column' }}>
                Message (optional)
                <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="A short note" style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </label>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ color: '#6b7280' }}>Minimum: ₹{minTransfer} • Fee: 2%</div>
                  <button className="btn-primary btn-gradient" type="submit" disabled={busy} style={{ padding: '10px 16px' }}>{busy ? 'Processing...' : 'Pay & Send'}</button>
                </div>
              </form>
            </div>
            {/* Transfer history section (below the transfer card) */}
            <div style={{ marginTop: 18 }}>
              <h3 className="transfer-header" style={{ marginTop: 0, fontSize: 16, padding: '10px 12px' }} onClick={handleToggleHistory} aria-expanded={showHistory}>
                <span>Transfer History</span>
                <span className="transfer-caret">{showHistory ? '▾' : '▸'}</span>
              </h3>
              <div style={{ overflow: 'hidden', transition: 'max-height 260ms ease', maxHeight: showHistory ? 800 : 0 }}>
                <div style={{ paddingTop: showHistory ? 12 : 0 }}>
                  {history.length === 0 ? (
                    <div style={{ color: '#6b7280', padding: 12 }}>No transfers yet.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {history.map((t) => (
                        <li key={String(t._id)} style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid rgba(15,23,42,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700 }}>{t.type === 'sent' ? 'Sent' : 'Received'} {t.type === 'sent' ? `to ${t.counterpartyUniqueId || ''}` : `from ${t.counterpartyUniqueId || ''}`}</div>
                            <div style={{ fontWeight: 700 }}>₹{Number(t.amount).toFixed(2)}</div>
                          </div>
                          <div style={{ color: '#798190ff', marginTop: 6, fontSize: 13 }}>{t.counterpartyName || ''} • {new Date(t.createdAt).toLocaleString()}</div>
                          {t.message && <div style={{ marginTop: 8, color: '#374151' }}>{t.message}</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            {/* Bank transfer section */}
            <div style={{ marginTop: 18 }}>
              <h3 className="transfer-header" style={{ marginTop: 0, fontSize: 16, padding: '10px 12px' }} onClick={toggleBank} aria-expanded={showBankForm}>
                <span>Bank Transfer</span>
                <span className="transfer-caret">{showBankForm ? '▾' : '▸'}</span>
              </h3>
              <div style={{ color: '#6b7280', padding: '6px 12px' }}>Minimum amount applies • 5% service fee will be deducted from the requested amount.</div>
              <div style={{ overflow: 'hidden', transition: 'max-height 260ms ease', maxHeight: showBankForm ? 400 : 0 }}>
                <div style={{ paddingTop: showBankForm ? 12 : 0 }}>
                  {bankAccount ? (
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid rgba(15,23,42,0.04)', display: 'grid', gap: 8 }}>
                      <div style={{ opacity: 0.9 }}><strong>Holder:</strong> {bankAccount.holderName || '-'}</div>
                      <div style={{ opacity: 0.9 }}><strong>Bank:</strong> {bankAccount.bankName || '-'}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ opacity: 0.9 }}><strong>Account:</strong> {bankAccount.accountNumber || '-'}</div>
                      </div>
                      <div style={{ opacity: 0.9 }}><strong>IFSC:</strong> {bankAccount.ifsc || '-'}</div>
                    </div>
                  ) : (
                    <div style={{ color: '#6b7280', padding: 12 }}>No account details on file. Add account details in your Account page first.</div>
                  )}

                  <form onSubmit={onBankSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                      Amount (₹)
                      <input value={bankAmount} onChange={e=>setBankAmount(e.target.value)} placeholder="Amount" type="number" step="0.01" style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: '#6b7280' }}>Fee: 5% • Processed by admin</div>
                      <button className="btn-primary btn-gradient" type="submit" disabled={bankBusy} style={{ padding: '10px 16px' }}>{bankBusy ? 'Submitting...' : 'Request Bank Transfer'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer>
          <p>© 2025 JobPortal. All Rights Reserved.</p>
        </footer>
      </div>
        {/* toast */}
        {toast && (
          <div className={`toast ${toast.type || 'info'}`} onClick={() => setToast(null)}>
            {toast.message}
          </div>
        )}

        {/* confirmation card */}
        {confirm && (
          <div className="confirm-overlay" onClick={() => setConfirm(null)}>
            <div className="confirm-card" onClick={(e)=>e.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>Transfer successful</h3>
              <div style={{ margin: '8px 0', color: '#374151' }}>
                Sent <strong>₹{confirm.amt}</strong> to <strong>{confirm.toId}</strong>
              </div>
              <div style={{ color: '#6b7280', marginBottom: 12 }}>Fee (2%): <strong>₹{confirm.fee}</strong></div>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Total deducted: ₹{confirm.total}</div>
              <div style={{ color: '#0f172a', marginBottom: 16 }}>New balance: <strong>₹{confirm.newBalance}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn-outline" onClick={() => setConfirm(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
        {showIdCard && <IDCardGenerator user={user} onClose={closeIdCard} />}
    </>
  );
}
