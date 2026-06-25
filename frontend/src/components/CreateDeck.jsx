import React, { useState } from 'react';

export default function CreateDeck({ apiBase, token, onNavigate }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (notes.trim().length < 15) {
      setError('Please paste a longer text paragraph (at least 15 characters) so the NLP model can extract keywords.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBase}/api/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate deck. Make sure your notes are rich in details.');
      }

      onNavigate('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay glass-panel-glow" style={{ maxWidth: '500px', margin: '4rem auto' }}>
        <div className="spinner"></div>
        <h3 className="title-gradient" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Extracting Key Concepts</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Our local NLP engine is parsing your notes, performing syntactic dependency checks, and extracting named entities to generate cards...
        </p>
      </div>
    );
  }

  return (
    <div className="create-deck-card glass-panel-glow">
      <h2>
        <span className="title-gradient">Create AI Flashcard Deck</span>
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Enter a title, paste your study notes, and the backend NLP model will automatically identify definitions, relationships, and entities to create interactive flashcards.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="deckName">Deck Title</label>
          <input
            type="text"
            id="deckName"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cellular Biology - Krebs Cycle"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label" htmlFor="notesText">Study Notes / Reference Text</label>
          <textarea
            id="notesText"
            className="form-textarea"
            rows="8"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your study guide, paragraph, or book notes here. E.g.
'Photosynthesis is the process used by plants to convert light energy into chemical energy. This chemical energy is stored in carbohydrate molecules. The process takes place primarily in leaves. Chlorophyll is the green pigment that absorbs light.'"
            required
          ></textarea>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            Tip: Writing clear, informational sentences (e.g. &quot;X is Y&quot; or &quot;X discovered Y in Z&quot;) yields the highest quality cards.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => onNavigate('dashboard')}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Generate Flashcards
          </button>
        </div>
      </form>
    </div>
  );
}
