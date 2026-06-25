import React, { useState, useEffect } from 'react';

export default function FlashcardReview({ deck, apiBase, token, onNavigate }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [demoMode, setDemoMode] = useState(true); // Default to True for easy evaluation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewMode, setReviewMode] = useState('due'); // 'due' or 'all'
  const [sessionStats, setSessionStats] = useState({ known: 0, notKnown: 0 });

  const fetchCards = async (mode = 'due') => {
    setLoading(true);
    setError('');
    setReviewMode(mode);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    const endpoint = mode === 'due' 
      ? `/api/cards/deck/${deck.id}/review` 
      : `/api/cards/deck/${deck.id}/all`;

    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load flashcards for this deck.');
      }

      const data = await response.json();
      setCards(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards('due');
  }, [deck.id]);

  const handleReview = async (known) => {
    const currentCard = cards[currentIndex];
    
    // Save review to backend
    try {
      const response = await fetch(`${apiBase}/api/cards/${currentCard.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ known, demo_mode: demoMode })
      });

      if (!response.ok) throw new Error('Failed to save card progress.');
      
      const updatedCard = await response.json();
      
      // Update session stats
      setSessionStats(prev => ({
        known: prev.known + (known ? 1 : 0),
        notKnown: prev.notKnown + (!known ? 1 : 0)
      }));

      // Animate transition: Unflip first, then advance index after transition
      setIsFlipped(false);
      
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300); // matches the unflip transition delay

    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Fetching review session...</p>
      </div>
    );
  }

  // Session complete (or no cards due)
  const isSessionOver = currentIndex >= cards.length;

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto' }}>
        <p className="error-banner">{error}</p>
        <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="review-board">
        <div className="empty-review-state glass-panel-glow">
          <span className="empty-emoji">🎉</span>
          <h2>All Caught Up!</h2>
          <p>
            No flashcards are due for review right now. Spaced repetition scheduler has queued them for later.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn-primary" onClick={() => fetchCards('all')}>
              Practice All Cards Anyway
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSessionOver) {
    return (
      <div className="review-board">
        <div className="empty-review-state glass-panel-glow">
          <span className="empty-emoji">🎓</span>
          <h2>Deck Finished!</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            You completed your study session for <strong>{deck.name}</strong>.
          </p>
          
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-item" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div className="stat-val" style={{ color: '#34d399' }}>{sessionStats.known}</div>
              <div className="stat-lbl">Known</div>
            </div>
            <div className="stat-item" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div className="stat-val" style={{ color: '#f87171' }}>{sessionStats.notKnown}</div>
              <div className="stat-lbl">Not Known</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              className="btn-primary" 
              onClick={() => {
                setSessionStats({ known: 0, notKnown: 0 });
                fetchCards(reviewMode);
              }}
            >
              Study Again
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPct = (currentIndex / cards.length) * 100;

  return (
    <div className="review-board">
      <div className="review-header" style={{ width: '100%' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff' }}>{deck.name}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {reviewMode === 'due' ? 'Reviewing due cards' : 'Practicing all cards'}
          </span>
        </div>

        <div className="demo-toggle-container">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Demo Intervals</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={demoMode} 
              onChange={() => setDemoMode(!demoMode)} 
            />
            <span className="slider"></span>
          </label>
          {demoMode && <span className="demo-mode-badge">Active</span>}
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-header">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{Math.round(progressPct)}% Complete</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
      </div>

      <div className="card-perspective" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard-3d ${isFlipped ? 'flipped' : ''}`}>
          
          {/* FRONT of the card */}
          <div className="card-side front">
            <span className="card-box-badge">Box {currentCard.box}</span>
            <span className="card-role-label">Question</span>
            <p className="card-text">{currentCard.question}</p>
            <span className="card-hint">Click card to reveal answer</span>
          </div>

          {/* BACK of the card */}
          <div className="card-side back">
            <span className="card-box-badge">Box {currentCard.box}</span>
            <span className="card-role-label">Answer</span>
            <p className="card-text" style={{ color: '#34d399' }}>{currentCard.answer}</p>
            <span className="card-hint">Mark based on your memory</span>
          </div>
          
        </div>
      </div>

      <div className="review-actions-prompt">
        {!isFlipped 
          ? 'Click card to flip and check your memory' 
          : 'Did you know this card before flipping?'
        }
      </div>

      <div className="action-buttons-group">
        {!isFlipped ? (
          <button 
            className="btn-secondary" 
            style={{ width: '100%', padding: '1rem', fontStyle: 'var(--font-heading)' }}
            onClick={() => setIsFlipped(true)}
          >
            Reveal Answer 🔄
          </button>
        ) : (
          <>
            <button 
              className="btn-review btn-review-not-known"
              onClick={() => handleReview(false)}
            >
              ❌ Not Known
            </button>
            <button 
              className="btn-review btn-review-known"
              onClick={() => handleReview(true)}
            >
              ✓ Known
            </button>
          </>
        )}
      </div>
    </div>
  );
}
