import React, { useState } from 'react';
import { Lock, Heart } from 'lucide-react';
import { Button, Navbar } from '../components/index';
import { User, ViewType } from '../types';
import styles from '../styles/UnlockDatePage.module.css';

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
    if (!user.specialDate) { onNavigate('set-date'); return; }
    if (inputDate === user.specialDate) {
      onNavigate('home');
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={[
      styles.page,
      darkMode ? styles.pageDark : styles.pageLight,
    ].join(' ')}>

      {darkMode && (
        <div className={styles.blobs}>
          <div className={styles.blobTopLeft} />
          <div className={styles.blobBottomRight} />
        </div>
      )}

      <div className={[styles.content, shake ? styles.contentShake : ''].join(' ')}>
        <div className={[styles.iconBox, darkMode ? styles.iconBoxDark : styles.iconBoxLight].join(' ')}>
          {error
            ? <Lock size={32} color="#fb7185" />
            : <Heart size={32} color={darkMode ? '#fda4af' : '#f43f5e'} />
          }
        </div>

        <h2 className={[styles.title, darkMode ? styles.titleDark : styles.titleLight].join(' ')}>
          {error ? 'Who are you? 🤔' : 'When did it begin?'}
        </h2>
        <p className={[styles.subtitle, darkMode ? styles.subtitleDark : styles.subtitleLight].join(' ')}>
          Enter our special date to unlock.
        </p>

        <form onSubmit={handleUnlock}>
          <input
            type="date"
            value={inputDate}
            onChange={(e) => { setInputDate(e.target.value); setError(false); }}
            className={[styles.dateInput, darkMode ? styles.dateInputDark : styles.dateInputLight].join(' ')}
            required
          />
          <Button type="submit" variant="primary" className={darkMode ? 'bg-rose-600 hover:bg-rose-500 border-none' : ''}>
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
    </div>
  );
};