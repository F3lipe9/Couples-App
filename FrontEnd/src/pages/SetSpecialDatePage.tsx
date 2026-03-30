import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Button } from '../components/index';
import { User, ViewType } from '../types';
import styles from '../styles/SetSpecialDatePage.module.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface SetSpecialDatePageProps {
  user: User;
  firebaseUser: FirebaseUser;
  onUpdateUser: (user: User) => void;
  onNavigate: (view: ViewType) => void;
}

export const SetSpecialDatePage: React.FC<SetSpecialDatePageProps> = ({
  user,
  firebaseUser,
  onUpdateUser,
  onNavigate,
}) => {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${API_URL}/users/${user.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ specialDate: date }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Update failed');
      }

      const updated = await response.json();
      onUpdateUser(updated);
      onNavigate('unlock');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Calendar size={48} className={styles.icon} />
        <h2 className={styles.title}>When did it start?</h2>
        <p className={styles.subtitle}>
          Pick the date that means the most to us. This will be our password to enter.
        </p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.dateInput}
        />
        <Button onClick={handleSave} isLoading={loading}>Save Date</Button>
      </div>
    </div>
  );
};