import React from 'react';

export default function WalletBadge({ wallet = 0, onClick }) {
  return (
    <div className="wallet-badge" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : -1} onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}>
      <span className="wallet-icon" aria-hidden>💰</span>
      <strong className="wallet-amount">₹{Number(wallet ?? 0)}</strong>
    </div>
  );
}
