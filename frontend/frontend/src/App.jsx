import React, { useState } from 'react';
import { Dashboard, EvaluationForm } from './pages';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh", color: "#111827" }}>
      <header style={{ backgroundColor: "#1e293b", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Interview Evaluation Portal</h1>
        <nav>
          <button 
            onClick={() => setCurrentView('dashboard')}
            style={{ background: 'none', border: 'none', color: currentView === 'dashboard' ? '#60a5fa' : '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            Dashboard
          </button>
        </nav>
      </header>

      <main>
        {currentView === 'dashboard' && (
          <Dashboard onNavigateToEval={() => setCurrentView('evaluation')} />
        )}
        {currentView === 'evaluation' && (
          <EvaluationForm onBack={() => setCurrentView('dashboard')} />
        )}
      </main>
    </div>
  );
}