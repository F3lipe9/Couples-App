import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { Button, Input } from '../components/index';
import { User, ViewType } from '../types';
import styles from '../styles/LoginPage.module.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface LoginPageProps {
  onNavigate: (view: ViewType) => void;
  onLogin: (user: User, firebaseUser: import('firebase/auth').User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();

      const response = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }
      const appUser: User = await response.json();
      onLogin(appUser, fbUser);
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Incorrect email or password.'
        : err.message || 'Login failed';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Enter our shared world.</p>
        </div>
        <form onSubmit={handleLogin}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button isLoading={loading} type="submit">Log In</Button>
        </form>
        <p className={styles.footer}>
          No account?{' '}
          <button onClick={() => onNavigate('signup')} className={styles.footerLink}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};