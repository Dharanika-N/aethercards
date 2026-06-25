import React, { useState, useEffect } from 'react';

export default function Dashboard({ apiBase, token, onNavigate, onSelectDeck }) {
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch decks
      const decksRes = await fetch(`${apiBase}/api/decks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!decksRes.ok) throw new Error('Failed to load decks.');
      const decksData = await decksRes.json();
      setDecks(decksData);

      // Fetch stats
      const statsRes = await fetch(`${apiBase}/api/decks/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!statsRes.ok) throw new Error('Failed to load statistics.');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteDeck = async (deckId, e) => {
    e.stopPropagation(); // Avoid triggering card click
    if (!confirm('Are you sure you want to delete this deck and all of its generated flashcards? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/decks/${deckId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete deck.');
      
      // Refresh
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Helper to compute Leitner Box percentages for bar representation
  const renderLeitnerProgress = () => {
    if (!stats || stats.card_count === 0) return null;
    
    const { box_distribution, card_count } = stats;
    const segments = [];
    
    for (let box = 1; box <= 5; box++) {
      const count = box_distribution[`box_${box}`] || 0;
      const pct = (count / card_count) * 100;
      if (pct > 0) {
        segments.push({
          box,
          count,
          pct,
          className: `box-segment box-seg-${box}`
        });
      }
    }

    return (
      <div className="leitner-boxes">
        <div className="leitner-boxes-title">Leitner Mastery Distribution</div>
        <div className="boxes-bar">
          {segments.map((seg) => (
            <div 
              key={seg.box} 
              className={seg.className} 
              style={{ width: `${seg.pct}%` }}
              title={`Box ${seg.box}: ${seg.count} cards (${Math.round(seg.pct)}%)`}
            >
              {seg.pct > 8 ? `Box ${seg.box}` : ''}
            </div>
          ))}
        </div>
        <div className="box-labels">
          <span>Box 1 (Review Daily)</span>
          <span>Box 5 (Mastered)</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading your study dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">
            <span className="title-gradient">Your Decks</span>
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Create and review flashcards using spaced repetition.</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('create-deck')}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span> New AI Deck
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="decks-section">
          {decks.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📚</span>
              <h3>No study decks found</h3>
              <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>
                Paste your notes or text articles, and let our NLP model extract key concepts into custom flashcards.
              </p>
              <button className="btn-primary" onClick={() => onNavigate('create-deck')}>
                Create Your First Deck
              </button>
            </div>
          ) : (
            <div className="decks-list">
              {decks.map((deck) => (
                <div 
                  key={deck.id} 
                  className="deck-card glass-panel"
                  onClick={() => onSelectDeck(deck)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="deck-info">
                    <h3>{deck.name}</h3>
                    <div className="deck-count">
                      <span>🎴 {deck.card_count} flashcards</span>
                    </div>
                  </div>
                  <div className="deck-actions">
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDeck(deck);
                      }}
                    >
                      Study Now
                    </button>
                    <button 
                      className="btn-danger" 
                      onClick={(e) => handleDeleteDeck(deck.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stats-section">
          {stats && (
            <>
              <div className="stats-widget glass-panel-glow">
                <h3>Mastery Overview</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-val">{stats.deck_count}</div>
                    <div className="stat-lbl">Decks</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-val">{stats.card_count}</div>
                    <div className="stat-lbl">Total Cards</div>
                  </div>
                  <div className="stat-item" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                    <div className="stat-val" style={{ color: 'var(--color-secondary)' }}>{stats.due_count}</div>
                    <div className="stat-lbl">Cards Due for Review</div>
                  </div>
                </div>
                
                {stats.card_count > 0 && (
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      🏆 Mastered (Box 5): <strong>{stats.mastered_count}</strong> / {stats.card_count} cards
                    </span>
                  </div>
                )}
                
                {renderLeitnerProgress()}
              </div>
              
              <div className="glass-panel" style={{ padding: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>How Leitner repetition works:</h4>
                <p style={{ marginBottom: '0.5rem' }}>
                  Cards start in <strong>Box 1</strong>. When you mark a card as <strong>Known</strong>, it moves to the next box, increasing the delay before you see it again.
                </p>
                <p>
                  Marking a card as <strong>Not Known</strong> resets it back to <strong>Box 1</strong> so you can practice it more frequently.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
