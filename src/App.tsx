/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AnalysisView } from './components/AnalysisView';
import { LiveMap } from './components/LiveMap';
import { HistoryView } from './components/HistoryView';
import { Chatbot } from './components/Chatbot';
import { SmartSuggestions } from './components/SmartSuggestions';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { SettingsProvider, useSettings } from './context/SettingsContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { config } = useSettings();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Invalid token');
      })
      .then(data => {
        setIsLoggedIn(true);
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token: string, username: string, role: string) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    setUser({ username, role });
    if (role === 'admin') {
      window.location.href = '/admin';
    } else {
      // For regular users, we can just re-render, no need to force a full reload.
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-zinc-950"><Loader2 className="animate-spin text-white" size={32} /></div>;
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (window.location.pathname === '/admin' && user?.role !== 'admin') {
    // If not admin and trying to access /admin, redirect to home
    window.location.href = '/';
    return null; // Or a loading indicator
  }

  if (window.location.pathname === '/admin' && user?.role === 'admin') {
    return <AdminPanel />;
  }

  return (
    <div 
      className="flex min-h-screen font-sans transition-colors duration-300"
      style={{ 
        backgroundColor: config.theme.background,
        color: config.theme.text
      }}
    >
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        isAdmin={user?.role === 'admin'}
        appName={config.content.appName}
      />
      
      <main className="flex-1 lg:ml-64 transition-all duration-200 flex flex-col min-h-screen">
        <div className="flex-1">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'map' && config.features.showMap && <LiveMap />}
          {activeTab === 'analysis' && <AnalysisView />}
          {activeTab === 'suggestions' && config.features.showSuggestions && <SmartSuggestions />}
          {activeTab === 'history' && config.features.showHistory && <HistoryView />}
        </div>

        <footer className="p-6 border-t border-zinc-200 text-center text-zinc-400 text-sm mt-auto">
          <p>&copy; {new Date().getFullYear()} Runtime Terror. All rights reserved.</p>
        </footer>
      </main>

      {config.features.showChatbot && <Chatbot />}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

