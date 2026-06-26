import React, { useState } from 'react';

export default function Login({ apiBase, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    
    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = 'Authentication failed. Please try again.';
        if (data && data.detail) {
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map(err => err.msg).join(', ');
          }
        }
        throw new Error(errorMsg);
      }

      // Save token in localStorage and notify parent
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_email', email);
      onLoginSuccess(data.access_token, email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel-glow">
        <div className="auth-header">
          <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <span className="nav-logo-icon" style={{ width: '48px', height: '48px', fontSize: '1.5rem', margin: '0 auto' }}>⚡</span>
          </div>
          <h2>
            <span className="title-gradient">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {isSignup 
              ? 'Join AetherCards to generate smart flashcards using AI.' 
              : 'Log in to continue studying your flashcard decks.'}
          </p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '0.9rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <p className="auth-toggle-msg">
          {isSignup ? 'Already have an account? ' : 'New to AetherCards? '}
          <span 
            className="auth-toggle-link" 
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}
