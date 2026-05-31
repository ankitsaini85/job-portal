import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import SpecialNavbar from "../components/SpecialNavbar";
import { useToast } from '../components/ToastContext';
import { buildUrl } from '../config/api';
import IDCardGenerator from '../components/IDCardGenerator';
import WalletBadge from '../components/WalletBadge';
import ChatPanel from '../components/ChatPanel';
import WorkSubmissionForm from '../components/WorkSubmissionForm';
import "./Welcome.css";

const SpecialJob = () => {
  // Access gating is now done via wallet on the Welcome page. Old sessionStorage code removed.

  let userName = "";
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    userName = u?.name || u?.email || "User";
    var userUniqueId = u?.uniqueId || '';
  } catch (e) {
    userName = "User";
    userUniqueId = '';
  }

  const [showIdCard, setShowIdCard] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const openIdCard = () => setShowIdCard(true);
  const closeIdCard = () => setShowIdCard(false);

  // wallet state
  const [wallet, setWallet] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return typeof u?.wallet === 'number' ? u.wallet : (u?.wallet ?? 0); 
    } catch (e) {
      return 0;
    }
  });

  const navigate = useNavigate();
  const [checkingWallet, setCheckingWallet] = useState(true);

  // iframe is shown by default (no open/close button) and sized to fill remaining viewport
  const [iframeHeight, setIframeHeight] = useState(600);
  const subHeaderRef = useRef(null);

  // Work timer: counts up from 0 to 8 hours (in milliseconds)
  const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
  const BASE_STORAGE_KEY = "specialJobStartTs";

  // build a per-user storage key so each user gets their own timer
  let userId = "anon";
  try {
    const uu = JSON.parse(localStorage.getItem("user") || "{}");
    userId = (uu?.email || uu?.name || "anon").toString();
  } catch (e) {
    userId = "anon";
  }
  const START_KEY = `${BASE_STORAGE_KEY}_${encodeURIComponent(userId)}`;
  const PAUSED_FLAG_KEY = `${START_KEY}_paused`;
  const PAUSED_ELAPSED_KEY = `${START_KEY}_pausedElapsed`;

  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const notifPollRef = useRef(null);

  const toast = useToast();

  useEffect(() => {
    // try to refresh wallet from backend if token present and enforce required balance
    const refreshWallet = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setCheckingWallet(false);
          return;
        }
        const res = await fetch(buildUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { setCheckingWallet(false); return; }
        const data = await res.json().catch(() => ({}));
        const u = data.user || {};
        if (u) {
          if (typeof u.wallet === 'number') setWallet(u.wallet);
          try { localStorage.setItem('user', JSON.stringify(u)); } catch (e) { /**/ }
        }

        // enforce wallet threshold only for SpecialJob access
        const REQUIRED = 5000;
        const walletAmount = Number((u && typeof u.wallet === 'number' ? u.wallet : (JSON.parse(localStorage.getItem('user')||'{}').wallet || 0)) || 0);
        if (walletAmount < REQUIRED) {
          const amountToAdd = Number((REQUIRED - walletAmount).toFixed(2));
          // redirect to add amount with context so user can top up and return
          navigate('/add-amount', { state: { required: REQUIRED, amountToAdd, job: { jobId: 'loan-mortgage', title: 'Loan & Mortgage' } } });
          return;
        }
      } catch (err) {
        // ignore errors but stop checking state
      } finally {
        setCheckingWallet(false);
      }
    };
    refreshWallet();

    const now = Date.now();
    const paused = sessionStorage.getItem(PAUSED_FLAG_KEY) === '1';
    if (paused) {
      // load paused elapsed and do not start interval
      const pausedElapsed = Number(sessionStorage.getItem(PAUSED_ELAPSED_KEY)) || 0;
      setElapsedMs(pausedElapsed >= EIGHT_HOURS_MS ? EIGHT_HOURS_MS : pausedElapsed);
      setIsPaused(true);
      return;
    }

    // not paused: either resume from existing start or start fresh
    let startTs = Number(sessionStorage.getItem(START_KEY));
    if (!startTs) {
      startTs = now;
      sessionStorage.setItem(START_KEY, String(startTs));
      setElapsedMs(0);
    } else {
      const diff = now - startTs;
      setElapsedMs(diff >= EIGHT_HOURS_MS ? EIGHT_HOURS_MS : Math.max(0, diff));
    }

    intervalRef.current = setInterval(() => {
      const currentStart = Number(sessionStorage.getItem(START_KEY)) || startTs;
      const newElapsed = Date.now() - currentStart;
      if (newElapsed >= EIGHT_HOURS_MS) {
        setElapsedMs(EIGHT_HOURS_MS);
        setSubmissionCount(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setElapsedMs(newElapsed);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [START_KEY, PAUSED_FLAG_KEY, PAUSED_ELAPSED_KEY]);

  // fetch notifications for current user from server
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  const res = await fetch(buildUrl('/api/auth/notifications'), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications((data.notifications || []).slice().reverse());
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    // poll every 15s for new notifications
    notifPollRef.current = setInterval(fetchNotifications, 15000);
    return () => {
      if (notifPollRef.current) clearInterval(notifPollRef.current);
    };
  }, []);


  // compute iframe height so it fills remaining viewport under the sub-header
  useEffect(() => {
    const compute = () => {
      try {
  const rect = subHeaderRef.current && subHeaderRef.current.getBoundingClientRect();
  const top = rect ? rect.bottom : 0;
  // prefer a taller view: try to extend by 120px but cap at viewport-40, and ensure a roomy minimum
  const minH = 800;
  const extended = window.innerHeight - top + 120;
  const h = Math.min(window.innerHeight - 40, Math.max(minH, extended));
  setIframeHeight(h);
      } catch (e) {
        setIframeHeight(Math.max(200, window.innerHeight - 120));
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // users should not be able to delete notifications from UI; admin manages deletes.
  // keep API call available in code if needed, but hide delete controls in UI.
  const deleteNotification = async (nid) => {
    // intentionally left empty for security: only admin can delete notifications
    // if you want users to be able to delete their own notifications later,
    // implement an endpoint and enable this function accordingly.
  };

  const markNotificationRead = async (nid) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  const res = await fetch(buildUrl(`/api/auth/notifications/${nid}/read`), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      await fetchNotifications();
    } catch (err) {
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
  const res = await fetch(buildUrl('/api/auth/notifications/markAllRead'), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      await fetchNotifications();
    } catch (err) {
      // ignore
    }
  };

  const pauseOrResume = () => {
    if (isPaused) {
      // resume: compute new start so elapsed keeps counting
      const pausedElapsed = Number(sessionStorage.getItem(PAUSED_ELAPSED_KEY)) || 0;
      const newStart = Date.now() - pausedElapsed;
      sessionStorage.setItem(START_KEY, String(newStart));
      sessionStorage.removeItem(PAUSED_FLAG_KEY);
      sessionStorage.removeItem(PAUSED_ELAPSED_KEY);
      setIsPaused(false);

      if (intervalRef.current) setInterval(() => {
        const currentStart = Number(sessionStorage.getItem(START_KEY)) || newStart;
        const newElapsed = Date.now() - currentStart;
        if (newElapsed >= EIGHT_HOURS_MS) {
          setElapsedMs(EIGHT_HOURS_MS);
          setSubmissionCount(0);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setElapsedMs(newElapsed);
        }
      }, 1000);
    } else {
      // pause: persist elapsed and stop interval
      const currentStart = Number(sessionStorage.getItem(START_KEY)) || Date.now();
      const currentElapsed = Math.min(Date.now() - currentStart, EIGHT_HOURS_MS);
      sessionStorage.setItem(PAUSED_FLAG_KEY, '1');
      sessionStorage.setItem(PAUSED_ELAPSED_KEY, String(currentElapsed));
      setElapsedMs(currentElapsed);
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // helper to format elapsed ms into HH:MM:SS
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <>
      <SpecialNavbar />
      <div className="welcome-container specialjob">
        <div className="sub-header" ref={subHeaderRef}>
          <div className="sub-header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' }}>
              <div className="greeting">
                <h2 style={{ margin: 0 }}>Hello, welcome {userName}</h2>
                {userUniqueId && (
                  <div
                    className="id-badge"
                    style={{ marginLeft: 10, cursor: 'pointer' }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openIdCard(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openIdCard(); } }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="id-label">ID</span>
                    <strong className="id-value">{userUniqueId}</strong>
                  </div>
                )}
                <WalletBadge wallet={wallet} onClick={() => { try { window.location.href = '/wallet-transfer'; } catch(e){} }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Notifications bell */}
                <div style={{ position: 'relative' }}>
                  <button className="notif-bell" onClick={() => { const will = !notifOpen; setNotifOpen(will); if (will) fetchNotifications(); }} aria-expanded={notifOpen} aria-label="Notifications">
                    🔔
                    {notifications && notifications.filter(n => !n.read).length > 0 && (
                      <span className="notif-count">{notifications.filter(n => !n.read).length}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="notif-dropdown" role="menu">
                      <div className="notif-header">Notifications</div>
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications</div>
                      ) : (
                        <ul className="notif-list">
                          {notifications.map(n => (
                            <li key={String(n._id)} className="notif-item">
                              <div className="notif-title">{n.title}</div>
                              {n.body && <div className="notif-body">{n.body}</div>}
                              <div className="notif-meta">
                                <small>{new Date(n.createdAt).toLocaleString()}</small>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  {!n.read && <button className="notif-mark" onClick={() => markNotificationRead(n._id)}>Mark read</button>}
                                </div>
                              </div>
                            </li>
                          ))}
                          <li style={{ padding: 8, textAlign: 'center' }}>
                            <button className="btn-outline" onClick={markAllRead}>Mark all read</button>
                          </li>
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {/* Chat button */}
                <div>
                  <button className="notif-bell" onClick={() => setChatOpen((s) => !s)} aria-expanded={chatOpen} aria-label="Chat">
                    💬
                  </button>
                </div>
                {/* TOP TIMER (right side) */}
                <div className="top-timer" aria-live="polite">
                  <div className="top-timer-label">Work Time</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="top-timer-value">{formatTime(elapsedMs)} / 08:00:00</div>
                    <button
                      onClick={pauseOrResume}
                      className="timer-btn"
                      style={{ height: 32, padding: '4px 10px' }}
                    >
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="welcome-body" style={{ padding: 0, margin: 0 }}>
          {/* Work submission form embedded directly on page */}
          <div style={{ 
            width: '100%', 
            minHeight: iframeHeight,
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'flex-start',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            overflow: 'hidden',
            padding: '30px 20px',
            margin: 0
          }}>
            {/* Animated background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              animation: 'pulse 4s ease-in-out infinite'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700 }}>
              {/* Submission Counter */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                padding: '16px 24px',
                marginBottom: 24,
                color: '#fff',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                📊 Submissions Today: <span style={{ fontSize: 20, fontWeight: 800 }}>{submissionCount}</span>
              </div>

              {/* Form Container */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 20,
                padding: 32,
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                <WorkSubmissionForm 
                  onClose={() => {}} 
                  onSuccess={() => {
                    setSubmissionCount(prev => prev + 1);
                    toast('Work submission saved successfully!', { type: 'success' });
                  }}
                />
              </div>
            </div>
          </div>
        </main>
        {showIdCard && <IDCardGenerator user={JSON.parse(localStorage.getItem('user')||'{}')} onClose={closeIdCard} />}
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} userName={userName} userId={userUniqueId} />
        <footer>
          <p>© 2025 JobPortal. All Rights Reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default SpecialJob;
