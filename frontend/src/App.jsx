import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateDeck from './components/CreateDeck';
import FlashcardReview from './components/FlashcardReview';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState(localStorage.getItem('user_email') || '');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDeck, setSelectedDeck] = useState(null);

  const handleLoginSuccess = (newToken, userEmail) => {
    setToken(newToken);
    setEmail(userEmail);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    setToken('');
    setEmail('');
    setCurrentView('dashboard');
  };

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  const handleSelectDeck = (deck) => {
    setSelectedDeck(deck);
    setCurrentView('review');
  };

  return (
    <div className="app-container">
      <Navbar 
        email={email} 
        onLogout={handleLogout} 
        onNavigate={navigateTo} 
        currentView={currentView}
      />
      
      <main className="main-content">
        {!token ? (
          <Login 
            apiBase={API_BASE} 
            onLoginSuccess={handleLoginSuccess} 
          />
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard 
                apiBase={API_BASE} 
                token={token} 
                onNavigate={navigateTo} 
                onSelectDeck={handleSelectDeck}
              />
            )}
            
            {currentView === 'create-deck' && (
              <CreateDeck 
                apiBase={API_BASE} 
                token={token} 
                onNavigate={navigateTo} 
              />
            )}
            
            {currentView === 'review' && selectedDeck && (
              <FlashcardReview 
                deck={selectedDeck} 
                apiBase={API_BASE} 
                token={token} 
                onNavigate={navigateTo} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
