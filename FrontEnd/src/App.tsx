import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from './firebase';
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

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export const App: React.FC = () => {
  const [view, setView]                 = useState<ViewType>('signup');
  const [user, setUser]                 = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading]           = useState(true);
  const [darkMode, setDarkMode]         = useState<boolean>(() => {
    return localStorage.getItem('couple_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('couple_dark_mode', String(next));
      return next;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const token = await fbUser.getIdToken();
          const res = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const appUser: User = await res.json();
            setUser(appUser);
            setView(appUser.specialDate ? 'unlock' : 'set-date');
          } else {
            setUser(null);
            setFirebaseUser(null);
            setView('signup');
          }
        } catch {
          setUser(null);
          setFirebaseUser(null);
          setView('signup');
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setView('signup');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogin = (loggedInUser: User, fbUser: FirebaseUser) => {
    setUser(loggedInUser);
    setFirebaseUser(fbUser);
    setView(loggedInUser.specialDate ? 'unlock' : 'set-date');
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
      {view === 'signup' && (
        <SignupPage onLogin={handleLogin} onNavigate={setView} />
      )}
      {view === 'login' && (
        <LoginPage onLogin={handleLogin} onNavigate={setView} />
      )}
      {view === 'set-date' && user && firebaseUser && (
        <SetSpecialDatePage
          user={user}
          firebaseUser={firebaseUser}
          onUpdateUser={handleUpdateUser}
          onNavigate={setView}
        />
      )}
      {view === 'unlock' && user && (
        <UnlockDatePage user={user} onNavigate={setView} />
      )}
      {view === 'gallery' && user && firebaseUser && (
        <GalleryPage
          user={user}
          firebaseUser={firebaseUser}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onNavigate={setView}
        />
      )}
      {view === 'upload' && user && firebaseUser && (
        <UploadPage
          user={user}
          firebaseUser={firebaseUser}
          darkMode={darkMode}
          onNavigate={setView}
        />
      )}
      {view === 'upgrade' && user && firebaseUser && (
        <UpgradePage
          user={user}
          firebaseUser={firebaseUser}
          onUpdateUser={handleUpdateUser}
          onNavigate={setView}
        />
      )}
    </div>
  );
};