import React, { useState } from 'react';
import { usePostureData } from './hooks/usePostureData';
import { Login } from './components/Login';
import { ServiceError } from './components/ServiceError';
import { Dashboard } from './components/Dashboard';
import { Activity } from 'lucide-react';
import './styles/index.css';

// Read API URL from environment variables, fallback to localhost:5000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const {
    historyData,
    loading,
    backendDown,
    mongodbDown,
    ubidotsDown,
    retrying,
    clearHistory,
    checkHealth,
  } = usePostureData(API_URL, token);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  // 1. If user is not authenticated, show Login screen
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} apiUrl={API_URL} />;
  }

  // 2. If data is loading, show a loading spinner
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={32} className="spinner" style={{ animationDuration: '2s', color: 'var(--color-primary)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>PosturaFit</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Iniciando fluxo de dados...</p>
      </div>
    );
  }

  // 3. If any connection check (Backend, Mongo, or Ubidots) has failed, show error banner
  if (backendDown || mongodbDown || ubidotsDown) {
    return (
      <ServiceError
        backendDown={backendDown}
        mongodbDown={mongodbDown}
        ubidotsDown={ubidotsDown}
        onRetry={checkHealth}
        retrying={retrying}
      />
    );
  }

  // 4. Render main application Dashboard
  return (
    <Dashboard
      historyData={historyData}
      onClearHistory={clearHistory}
      onLogout={handleLogout}
    />
  );
};

export default App;
