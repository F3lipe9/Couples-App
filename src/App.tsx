import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  SignupPage,
  LoginPage,
  SetSpecialDatePage,
  UnlockDatePage,
  GalleryPage,
  UploadPage,
  UpgradePage
} from './pages';
import { User, ViewType } from './types';

export const App: React.FC = () => {
  // Views: 'signup', 'login', 'set-date', 'unlock', 'gallery', 'upload', 'upgrade'
  const [view, setView] = useState<ViewType>('signup');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      // Basic session persistence check via local storage
      const stored = localStorage.getItem('couple_app_user');
      if (stored) {
        setUser(JSON.parse(stored));
        // If user is logged in, where do they go? 
        // We always force them to the "Unlock" gate for security/romance
        setView('unlock'); 
      } else {
        setView('signup'); // Default to signup for new users/demo
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('couple_app_user', JSON.stringify(updatedUser));
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('couple_app_user', JSON.stringify(loggedInUser));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="antialiased text-slate-800">
      {view === 'signup' && <SignupPage onLogin={handleLogin} onNavigate={setView} />}
      {view === 'login' && <LoginPage onLogin={handleLogin} onNavigate={setView} />}
      {view === 'set-date' && user && <SetSpecialDatePage user={user} onUpdateUser={handleUpdateUser} onNavigate={setView} />}
      {view === 'unlock' && user && <UnlockDatePage user={user} onNavigate={setView} />}
      {view === 'gallery' && user && <GalleryPage user={user} onNavigate={setView} />}
      {view === 'upload' && user && <UploadPage user={user} onNavigate={setView} />}
      {view === 'upgrade' && user && <UpgradePage user={user} onUpdateUser={handleUpdateUser} onNavigate={setView} />}
    </div>
  );
};
