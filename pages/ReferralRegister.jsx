import React, { useState } from 'react';
import SpecialNavbar from '../components/SpecialNavbar';
import { useSearchParams } from 'react-router-dom';
import { buildUrl } from '../config/api';
import { useToast } from '../components/ToastContext';
import './ReferralRegister.css';
import refferalImage from '../images/company-logo.png';

export default function ReferralRegister(){
  const [search] = useSearchParams();
  const ref = search.get('ref') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', phone: '' });
  const toast = useToast();

  const validate = () => {
    const next = { name: '', email: '', phone: '' };
    if (!name.trim()) next.name = 'Name is required';
    const em = email.trim();
    if (!em) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) next.email = 'Enter a valid email';
    const ph = phone.replace(/[^0-9]/g, '');
    if (!ph) next.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(ph)) next.phone = 'Phone must be 10 digits';
    setErrors(next);
    return !(next.name || next.email || next.phone);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // focus first invalid field
      setTimeout(() => {
        const first = document.querySelector('input[name]');
        if (first) first.focus();
      }, 0);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(buildUrl('/api/referral/register'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.replace(/[^0-9]/g, ''), referrerUniqueId: ref })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      toast('Thank you — your registration has been recorded', { type: 'success' });
      setName(''); setEmail(''); setPhone('');
      setErrors({ name: '', email: '', phone: '' });
    } catch (err) {
      toast(err.message || String(err), { type: 'error' });
    } finally { setBusy(false); }
  };

  return (
    <>
      {/* <SpecialNavbar /> */}
      <div className="welcome-container">
        <div className="sub-header">
          <div className="sub-header-inner">
            <div className="greeting">
              <h2>Registration</h2>
            
            </div>
            <div className="top-timer">
              <div className="top-timer-label">Referral Registration</div>
            </div>
          </div>
        </div>

        <main className="welcome-body">
          <div className="referral-card-wrap">
            <div className="referral-card">
             
              <form onSubmit={onSubmit} className="referral-form" noValidate>
                <img className='refferal-image' src={refferalImage} alt="" />
                {ref && <div style={{ marginTop: 8, fontSize: 14, color: '#333' }}>Referred by <strong>{ref}</strong></div>}

                <label>
                  Name
                  <input className="input-field" name="name" value={name} onChange={e=>{ setName(e.target.value); if (errors.name) setErrors(prev=>({ ...prev, name: '' })); }} placeholder="Full name" />
                  {errors.name && <div className="error-text">{errors.name}</div>}
                </label>

                <label>
                  Email
                  <input className="input-field" name="email" value={email} onChange={e=>{ setEmail(e.target.value); if (errors.email) setErrors(prev=>({ ...prev, email: '' })); }} placeholder="you@example.com" />
                  {errors.email && <div className="error-text">{errors.email}</div>}
                </label>

                <label>
                  Phone
                  <input className="input-field" name="phone" value={phone} onChange={e=>{ setPhone(e.target.value.replace(/[^0-9]/g, '')); if (errors.phone) setErrors(prev=>({ ...prev, phone: '' })); }} placeholder="10 digits" maxLength={10} />
                  {errors.phone && <div className="error-text">{errors.phone}</div>}
                </label>

                <div className="actions">
                  <button className="btn-outline" type="submit" disabled={busy}>{busy ? 'Submitting...' : 'Register'}</button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
