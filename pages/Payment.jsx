import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SpecialNavbar from '../components/SpecialNavbar';
import { useToast } from '../components/ToastContext';
import { buildUrl } from '../config/api';

const Payment = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const rawAmount = Number(state?.amount || 500);
  const minGateway = 100;
  const amount = rawAmount < minGateway ? minGateway : rawAmount;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const toast = useToast();

  useEffect(() => {
    // Stripe removed — payment verification handled by new gateway. If you have a provider
    // that redirects back with parameters, handle verification here. For now this page
    // opens a generic /api/payment/create endpoint to start checkout.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCheckout = async () => {
    setLoading(true);
    setMessage('');
    // open a new tab synchronously so browser allows navigation to provider
    const payWin = window.open('', '_blank');
    if (!payWin) {
      const note = 'Popup blocked. Please allow popups for this site to continue payment.';
      setMessage(note);
      if (toast) toast(note, { type: 'error' });
      setLoading(false);
      return;
    }
    // Notify user if input amount was adjusted to gateway minimum
    if (rawAmount < minGateway) {
      const note = 'Amount less then 100 to add is not allowed — adjusted to ₹100';
      setMessage(note);
      if (toast) toast(note, { type: 'warning' });
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      // Call the generic create endpoint (WatchPay integration will replace this)
      const createRes = await fetch(buildUrl('/api/payment/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      const tj = await createRes.json();
      if (!createRes.ok) throw new Error(tj.message || 'Failed to create payment');
      // if provider returns a checkout URL, open it; otherwise show returned message
      if (tj.url) {
        try { payWin.location.href = tj.url; } catch (e) { payWin.location = tj.url; }
      } else if (tj.message) {
        setMessage(tj.message);
        payWin.close();
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Checkout failed');
      try { if (payWin) payWin.close(); } catch(e){}
    } finally { setLoading(false); }
  };

  return (
    <>
      <SpecialNavbar />
      <div style={{ maxWidth: 720, margin: '40px auto', padding: 20 }}>
        <h2>Wallet Top-up</h2>
        <p>Please pay <strong>₹{amount}</strong> to access this job.</p>
        {message && <div style={{ color: 'red', marginBottom: 12 }}>{message}</div>}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-primary" onClick={startCheckout} disabled={loading}>{loading ? 'Starting...' : `Pay ₹${amount}`}</button>
          <button className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </div>
    </>
  );
};

export default Payment;
