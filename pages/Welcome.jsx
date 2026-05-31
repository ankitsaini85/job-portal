import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";
import WalletBadge from '../components/WalletBadge';
import { useToast } from '../components/ToastContext';
import IDCardGenerator from '../components/IDCardGenerator';
import { buildUrl } from '../config/api';
import image1 from '../images/data-analytics.png';
import image2 from '../images/data-entry.webp';
import image3 from '../images/loan-mortgage.webp';
import image4 from '../images/data-analytics-services.jpg';
import image5 from '../images/data-entry-service.jpg';
import image6 from '../images/Loan-Servicing.jpg';
const Welcome = () => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { return {}; }
  });
  const [copied, setCopied] = useState(false);
  const userName = user?.name || user?.email || 'User';
  const services = [
    {
      id: 'analytics',
      image: image4,
      title: 'Data Analytics',
      icon: '📊',
      short: 'Turn raw data into actionable insights using visualization, modelling and reporting.',
      details:
        'We offer end-to-end analytics: data cleaning, ETL pipelines, dashboards (Power BI/Tableau), and predictive modelling using Python and machine learning techniques to help decision making.'
    },
    {
      id: 'data-entry',
      image: image5,
      title: 'Data Entry',
      icon: '⌨️',
      short: 'Fast, accurate data entry and validation for large datasets with human + automated QA.',
      details:
        'High-throughput data capture, normalization and validation. We combine careful manual entry work with scripts to validate formats, remove duplicates and ensure readiness for downstream processing.'
    },
    {
      id: 'loan',
      image: image6,
      title: 'Loan & Mortgage Support',
      icon: '🏦',
      short: 'Assistance with loan application processing, eligibility checks and document verification.',
      details:
        'From pre-qualification checks to document verification and amortization schedules, we help streamline the mortgage lifecycle and reduce processing time while maintaining compliance.'
    }
  ];

  const [expanded, setExpanded] = React.useState(null);
  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  // navigation and wallet-based gating for Data Entry
  const navigate = useNavigate();

  const toast = useToast();
  const [jobCards, setJobCards] = useState([]);

  // load wallet from localStorage (and try to refresh later)
  const [wallet, setWallet] = React.useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return typeof u?.wallet === 'number' ? u.wallet : (u?.wallet ?? 0);
    } catch (e) {
      return 0;
    }
  });

  // try refreshing user (and wallet) from backend if token present
  React.useEffect(() => {
    const refresh = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
  const res = await fetch(buildUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const u = data.user || {};
        if (u) {
          setUser(u);
          if (typeof u.wallet === 'number') setWallet(u.wallet);
          try { localStorage.setItem('user', JSON.stringify(u)); } catch (e) {}
        }
      } catch (err) {
        // ignore
      }
    };
    refresh();
    // update wallet when localStorage.user changes in another tab or after payment
    const onStorage = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          setWallet(typeof u?.wallet === 'number' ? u.wallet : (u?.wallet ?? 0));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Load dynamic Job Cards for the jobs grid
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(buildUrl('/api/admin/job-cards'));
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data && Array.isArray(data.jobCards)) {
          setJobCards(data.jobCards);
        }
      } catch (e) {
        // ignore and keep fallback static cards
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // copy unique id to clipboard
  const copyUniqueId = async () => {
    if (!user?.uniqueId) return;
    try {
      await navigator.clipboard.writeText(user.uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast('Copy failed', { type: 'error' });
    }
  };

  const [showIdCard, setShowIdCard] = React.useState(false);
  const openIdCard = () => { if (!user) return; setShowIdCard(true); };
  const closeIdCard = () => setShowIdCard(false);

  const handleJobApply = async (job) => {
    // Require login
    const token = localStorage.getItem('token');
    if (!token) {
      toast('Please login to apply for jobs', { type: 'error' });
      return navigate('/login');
    }

    // Refresh user/wallet from server if possible
    let currentUser = user;
    try {
      const res = await fetch(buildUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        currentUser = data.user || currentUser;
        if (currentUser) {
          setUser(currentUser);
          if (typeof currentUser.wallet === 'number') setWallet(currentUser.wallet);
          try { localStorage.setItem('user', JSON.stringify(currentUser)); } catch (e) {}
        }
      }
    } catch (err) {
      // ignore refresh errors and fall back to local state
    }

    const walletAmount = Number((currentUser && typeof currentUser.wallet === 'number' ? currentUser.wallet : wallet) || 0);
    // Only enforce the wallet top-up requirement for Loan / Mortgage roles.
    // Be permissive: check job.jobId, job.id, title or summary so hosted/fallback cards are also detected.
    const required = 5000;
    const jobNid = (job && (job.jobId || job.id || '')).toString().toLowerCase();
    const titleLower = (job && (job.title || '')).toString().toLowerCase();
    const summaryLower = (job && (job.summary || '')).toString().toLowerCase();
    const requiresTopUp = /loan|mortgage/.test(jobNid) || /loan|mortgage/.test(titleLower) || /loan|mortgage/.test(summaryLower);
    if (requiresTopUp && walletAmount < required) {
      const amountToAdd = Number((required - walletAmount).toFixed(2));
      // send job info along so AddAmount page can return or show context after top-up
      return navigate('/add-amount', { state: { required, amountToAdd, job } });
    }

    // If this is a loan/mortgage job and the user already has enough wallet balance,
    // allow direct navigation to the special job page (or to the admin-provided link).
    if (requiresTopUp && walletAmount >= required) {
      if (job.navigationLink && job.navigationLink.trim()) {
        const link = job.navigationLink.trim();
        if (/^https?:\/\//i.test(link)) {
          window.open(link, '_blank', 'noopener,noreferrer');
        } else {
          navigate(link);
        }
        return;
      }
      navigate('/special-job');
      return;
    }

    // Priority 1: Use navigationLink if provided
    if (job.navigationLink && job.navigationLink.trim()) {
      const link = job.navigationLink.trim();
      // Check if external URL (starts with http/https)
      if (/^https?:\/\//i.test(link)) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        // Internal route
        navigate(link);
      }
      return;
    }

    // Priority 2: Use jobId for known routes. Only auto-open `/special-job` when admin explicitly set it.
    const jobId = job.id || job.jobId;
    const jobIdLower = (jobId || '').toString().toLowerCase();
    if ( /loan|mortgage/.test(jobIdLower) ) {
      if (job.navigationLink && job.navigationLink.trim() === '/special-job') {
        navigate('/special-job');
        return;
      }
      // don't silently redirect — show a helpful message instead
      toast('This job requires a specific admin page. Please contact the admin or view job details.', { type: 'info' });
      return;
    }

    // Fallback: Show placeholder toast
    toast(`${job.title || jobId} - Apply (placeholder)`, { type: 'info' });
  };

  // FAQ data and state for the accordion below services
  const faqs = [
    {
      id: 'fa1',
      q: 'What does the Data Analytics role cover?',
      a: 'Data Analytics includes data cleaning, ETL, dashboarding (Power BI / Tableau), exploratory analysis, and predictive modelling using Python/R to drive business decisions.'
    },
    {
      id: 'fa2',
      q: 'What kind of work is part of Data Entry services?',
      a: 'Data Entry covers accurate capture and validation of large volumes of data, template-based input, OCR-assisted workflows, duplication checks and manual QA to ensure high data quality.'
    },
    {
      id: 'fa3',
      q: 'What support is included in Loan & Mortgage processing?',
      a: 'Loan & Mortgage support includes application intake, document verification (KYC), eligibility checks, status tracking, and coordination with underwriting teams to speed up approvals.'
    }
  ];

  const [openFaq, setOpenFaq] = React.useState(null);
  const toggleFaq = (id) => setOpenFaq((prev) => (prev === id ? null : id));

  return (
    <div className="welcome-container">
      {/* Sub-header area behind the navbar (same height) */}
      <div className="sub-header">
        <div className="sub-header-inner">
          <div className="greeting">
            <h2>Hello, welcome  {userName}</h2>
            {user?.uniqueId && (
              <div
                className={`id-badge${copied ? ' copied' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openIdCard(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openIdCard(); } }}
                role="button"
                tabIndex={0}
                title="Click to view/generate ID card"
              >
                <span className="id-label">ID</span>
                <strong className="id-value">{user.uniqueId}</strong>
                <span className="id-hint">{copied ? 'Copied' : 'Click to view'}</span>
              </div>
            )}
            <WalletBadge wallet={wallet} onClick={() => navigate('/wallet-transfer')} />
          </div>
        </div>
      </div>

      <main className="welcome-body">
        {jobCards && jobCards.length > 0 ? (
          <div className="jobs-grid">
            {jobCards.map((c) => {
              // Prefer explicit jobId if provided; fallback to slug heuristics
              let nid = (c.jobId || '').trim().toLowerCase();
              if (!nid) {
                nid = (c.name || c.title || '').toLowerCase();
                if (nid.includes('data entry')) nid = 'data-entry';
                else if (nid.includes('loan') || nid.includes('mortgage')) nid = 'loan-mortgage';
                else if (nid.includes('analytic')) nid = 'data-analytics';
                else nid = c._id || (c.title || 'card');
              }
              const job = {
                id: nid,
                jobId: c.jobId,
                title: c.title,
                image: c.imageUrl,
                summary: c.summary,
                details: c.details || '',
                navigationLink: c.navigationLink || ''
              };
              return <JobCard key={c._id || nid} job={job} onApply={handleJobApply} />;
            })}
          </div>
        ) : (
          <div className="jobs-grid">
            {[{
              id: 'analytics',
              title: 'Data Analytics',
              image: image1,
              summary: 'Dashboards, reporting and predictive models to unlock insights.',
              details: 'Dashboards (Power BI/Tableau), ETL pipelines, statistical analysis, and predictive modelling using Python and ML workflows. Ideal for businesses wanting data-driven decisions.'
            },{
              id: 'data-entry',
              title: 'Data Entry',
              image: image2,
              summary: 'Accurate, scalable data capture and cleansing with QA.',
              details: 'High-throughput data capture and validation, custom templates, and automated checks to ensure data integrity for downstream systems.'
            },{
              id: 'loan',
              title: 'Loan & Mortgage Support',
              image: image3,
              summary: 'Application processing, document verification and underwriting support.',
              details: 'End-to-end loan processing including KYC/document verification, eligibility checks, and status tracking to reduce time-to-approval.'
            }].map((job) => (
              <JobCard key={job.id} job={job} onApply={handleJobApply} />
            ))}
          </div>
        )}
      </main>

      {/* Data Entry gating now uses wallet/payment flow (no code modal) */}

      {/* Services / offerings section */}
      <section className="services-section">
        <div className="services-inner">
          <h3 className="services-title">Our Services</h3>
          <p className="services-sub">Specialized solutions in Data Analytics, Data Entry and Loan & Mortgage processing — tailored for quality and speed.</p>

          <div className="services-grid">
            {services.map((s) => (
              <div key={s.id} className={`service-card variant-${s.id} ${expanded === s.id ? 'expanded' : ''}`}>
                {/* optional top image/banner for service */}
                <div className="service-image" style={ s.image ? { backgroundImage: `url(${s.image})` } : {} } aria-hidden />
                <div className="service-head">
                  <div className="service-icon" aria-hidden>
                    {s.icon}
                  </div>
                  <div className="service-meta">
                    <h4>{s.title}</h4>
                    <p className="service-short">{s.short}</p>
                  </div>
                </div>

                <div className="service-actions">
                  <button className="btn-outline" onClick={() => toggle(s.id)}>{expanded === s.id ? 'Close' : 'Learn more'}</button>
                  <button className="btn-primary" onClick={() => toast(`${s.title} - Contact flow (placeholder)`, { type: 'info' })}>Get Started</button>
                </div>

                <div className="service-details" aria-hidden={expanded !== s.id}>
                  <p>{s.details}</p>
                  <ul>
                    <li>Scalable workflows and SLAs</li>
                    <li>Secure handling and compliance</li>
                    <li>Quality checks & reporting</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ section to cover gap above the footer */}
      <section className="faq-section">
        <div className="faq-inner">
          <h3 className="faq-title">Frequently Asked Questions</h3>
          <p className="faq-sub">Common questions about our roles and what to expect.</p>

          <div className="faq-list">
            {faqs.map((f) => (
              <FAQItem key={f.id} faq={f} open={openFaq === f.id} onToggle={() => toggleFaq(f.id)} />
            ))}
          </div>
        </div>
      </section>

      {showIdCard && <IDCardGenerator user={user} onClose={closeIdCard} />}
      <footer>
        <p>© 2025 JobPortal. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Welcome;

function JobCard({ job, onApply }){
  const [open, setOpen] = React.useState(false);
  return (
    <article className={`job-card job-variant-${job.id} ${open ? 'open' : ''}`} aria-expanded={open}>
      {/* top image/banner */}
      <div className="job-image" style={ job.image ? { backgroundImage: `url(${job.image})` } : {} } aria-hidden>
        {!job.image && <div className="job-image-placeholder">{job.icon || '🏷️'}</div>}
      </div>
      <div className="job-head">
        <div className="job-title">{job.title}</div>
        <div className="job-summary">{job.summary}</div>
      </div>

      <div className="job-actions">
        <button className="btn-link" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Details'}</button>
        <button className="btn-cta" onClick={() => onApply && onApply(job)}>Apply</button>
      </div>

      <div className="job-details" style={{ maxHeight: open ? '260px' : '0px' }}>
        <p>{job.details}</p>
      </div>
    </article>
  );
}

function FAQItem({ faq, open, onToggle }){
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={onToggle} aria-expanded={open}>
        <span>{faq.q}</span>
        <span className="faq-caret">{open ? '−' : '+'}</span>
      </button>
      <div className="faq-answer" style={{ maxHeight: open ? '300px' : '0px' }} aria-hidden={!open}>
        <p>{faq.a}</p>
      </div>
    </div>
  );
}
