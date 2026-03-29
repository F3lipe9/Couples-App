import React, { useState } from 'react';
import { Lock, Heart } from 'lucide-react';
import { Button, Navbar} from '../components/index';
import { User, ViewType } from '../types';

interface UnlockDatePageProps {
  user: User;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate: (view: ViewType) => void;
}

export const UnlockDatePage: React.FC<UnlockDatePageProps> = ({
  user,
  darkMode,
  toggleDarkMode,
  onNavigate,
}) => {
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
      onNavigate('home');
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  // ── Theme tokens ────────────────────────────────────────────────────────
  const t = darkMode
    ? {
        page:        'bg-slate-900',
        iconBox:     'bg-white/10 border-white/20',
        title:       'text-white',
        subtitle:    'text-slate-400',
        input:       'bg-white/10 border-white/20 text-white placeholder-slate-500 focus:border-rose-500 focus:ring-rose-500',
        btnClass:    'bg-rose-600 hover:bg-rose-500 border-none',
      }
    : {
        page:        'bg-rose-50',
        iconBox:     'bg-rose-100 border-rose-200',
        title:       'text-slate-800',
        subtitle:    'text-slate-500',
        input:       'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:ring-rose-400',
        btnClass:    '',
      };

  return (
    <div className={`min-h-screen ${t.page} flex flex-col items-center justify-center p-6 pb-24 relative overflow-hidden transition-colors duration-300`}>
      {/* Background blobs — only in dark mode */}
      {darkMode && (
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-rose-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
        </div>
      )}

      <div className={`w-full max-w-sm text-center z-10 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className={`w-20 h-20 ${t.iconBox} backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-6 border`}>
          {error
            ? <Lock className="w-8 h-8 text-rose-400" />
            : <Heart className={`w-8 h-8 ${darkMode ? 'text-rose-300' : 'text-rose-500'}`} />
          }
        </div>

        <h2 className={`text-3xl ${t.title} font-serif mb-2`}>
          {error ? 'Who are you? 🤔' : 'When did it begin?'}
        </h2>
        <p className={`${t.subtitle} mb-8`}>Enter our special date to unlock.</p>

        <form onSubmit={handleUnlock}>
          <input
            type="date"
            value={inputDate}
            onChange={(e) => { setInputDate(e.target.value); setError(false); }}
            className={`w-full border rounded-xl px-4 py-4 text-center text-xl focus:outline-none focus:ring-1 transition-all mb-6 ${t.input}`}
            required
          />
          <Button type="submit" variant="primary" className={t.btnClass}>
            Unlock Memories
          </Button>
        </form>
      </div>

      <Navbar
        variant="minimal"
        currentView="unlock"
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onNavigate={onNavigate}
      />

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