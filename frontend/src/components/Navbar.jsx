import React from 'react';

export default function Navbar({ email, onLogout, onNavigate, currentView }) {
  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => onNavigate('dashboard')}>
        <span className="nav-logo-icon">⚡</span>
        <span>Aether<span style={{ color: 'var(--color-primary)' }}>Cards</span></span>
      </div>
      
      <div className="nav-links">
        {email && (
          <>
            <button 
              className="btn-secondary"
              onClick={() => onNavigate('dashboard')}
              style={{ 
                padding: '0.5rem 1rem', 
                fontSize: '0.9rem',
                borderColor: currentView === 'dashboard' ? 'var(--color-primary)' : 'var(--border-glass)',
                color: currentView === 'dashboard' ? 'var(--color-primary)' : 'var(--text-primary)'
              }}
            >
              Dashboard
            </button>
            <div className="nav-user">
              <span className="nav-email" style={{ display: 'none' }}>{email}</span> {/* Hidden on mobile, can show conditionally */}
              <span className="nav-email" style={{ display: 'inline-block', marginRight: '0.5rem' }}>{email}</span>
              <button 
                className="btn-danger" 
                onClick={onLogout}
                style={{ fontSize: '0.85rem' }}
              >
                Log Out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
