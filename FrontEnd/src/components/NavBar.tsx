import React, { useState } from 'react';
import { Settings, Home, Image, LogOut, Moon, Sun, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { ViewType } from '../types';

interface NavbarProps {
  currentView: ViewType;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate: (view: ViewType) => void;
  /** 'full' shows all 3 nav buttons; 'minimal' shows only logout + dark mode */
  variant?: 'full' | 'minimal';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  darkMode,
  toggleDarkMode,
  onNavigate,
  variant = 'full',
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(firebaseAuth);
  };

  // ── Theme tokens ────────────────────────────────────────────────────────
  const base = darkMode
    ? 'bg-slate-900/90 border-white/10 text-slate-400'
    : 'bg-white/90 border-slate-200 text-slate-500';

  const activeIcon = 'text-rose-500';

  const iconBtn = darkMode
    ? 'hover:bg-white/10 hover:text-white rounded-full p-3 transition-colors'
    : 'hover:bg-slate-100 hover:text-slate-800 rounded-full p-3 transition-colors';

  const closeBtn = darkMode
    ? 'bg-white/10 text-white rounded-full p-3 transition-colors hover:bg-white/20'
    : 'bg-rose-50 text-rose-500 rounded-full p-3 transition-colors hover:bg-rose-100';

  // ── Minimal variant (UnlockDatePage) ────────────────────────────────────
  if (variant === 'minimal') {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md ${base}`}>
        <div className="flex items-center justify-around px-6 py-3 max-w-lg mx-auto">
          <button onClick={toggleDarkMode} className={iconBtn} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button onClick={handleSignOut} className={iconBtn} title="Sign out">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // ── Full variant — settings open ─────────────────────────────────────────
  // Layout: [X / close] [dark mode toggle] [logout]
  if (settingsOpen) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md ${base}`}>
        <div className="flex items-center justify-around px-6 py-3 max-w-lg mx-auto">
          {/* Left — close settings (replaces Settings icon) */}
          <button onClick={() => setSettingsOpen(false)} className={closeBtn} title="Close">
            <X className="w-6 h-6" />
          </button>
          {/* Middle — dark mode toggle */}
          <button onClick={toggleDarkMode} className={iconBtn} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          {/* Right — logout */}
          <button onClick={handleSignOut} className={iconBtn} title="Sign out">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // ── Full variant — default ───────────────────────────────────────────────
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md ${base}`}>
      <div className="flex items-center justify-around px-6 py-3 max-w-lg mx-auto">
        {/* Left — Settings */}
        <button onClick={() => setSettingsOpen(true)} className={iconBtn} title="Settings">
          <Settings className="w-6 h-6" />
        </button>
        {/* Middle — Home */}
        <button
          onClick={() => onNavigate('home' as ViewType)}
          className={`${iconBtn} ${currentView === 'home' ? activeIcon : ''}`}
          title="Home"
        >
          <Home className="w-6 h-6" />
        </button>
        {/* Right — Gallery */}
        <button
          onClick={() => onNavigate('gallery')}
          className={`${iconBtn} ${currentView === 'gallery' ? activeIcon : ''}`}
          title="Gallery"
        >
          <Image className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};