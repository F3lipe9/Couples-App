import React, { useState } from 'react';
import { Lock, Heart, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { Button } from '../components';
import { User, ViewType } from '../types';

interface UnlockDatePageProps {
  user: User;
  onNavigate: (view: ViewType) => void;
}

export const UnlockDatePage: React.FC<UnlockDatePageProps> = ({ user, onNavigate }) => {
  const [inputDate, setInputDate] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.specialDate) {
      onNavigate('set-date');
      return;
    }

    if (inputDate === user.specialDate) {
      onNavigate('gallery');
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleSignOut = async () => {
    await signOut(firebaseAuth);
    // onAuthStateChanged in App.tsx will handle redirect
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Logout button */}
      <button
        onClick={handleSignOut}
        className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
        title="Sign out"
      >
        <LogOut className="w-5 h-5" />
      </button>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-rose-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className={`w-full max-w-sm text-center z-10 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
          {error ? <Lock className="w-8 h-8 text-rose-400" /> : <Heart className="w-8 h-8 text-rose-300" />}
        </div>

        <h2 className="text-3xl text-white font-serif mb-2">
          {error ? 'Who are you? 🤔' : 'When did it begin?'}
        </h2>
        <p className="text-slate-400 mb-8">Enter our special date to unlock.</p>

        <form onSubmit={handleUnlock}>
          <input
            type="date"
            value={inputDate}
            onChange={(e) => { setInputDate(e.target.value); setError(false); }}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-center text-xl placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all mb-6"
            required
          />
          <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-500 border-none">
            Unlock Memories
          </Button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};