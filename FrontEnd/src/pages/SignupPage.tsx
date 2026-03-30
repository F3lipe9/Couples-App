import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { Heart } from 'lucide-react';
import { Button, Input } from '../components/index';
import { User, ViewType } from '../types';
import styles from '../styles/SignupPage.module.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface SignupPageProps {
  onNavigate: (view: ViewType) => void;
  onLogin: (user: User, firebaseUser: import('firebase/auth').User) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return alert("Passwords don't match!");
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();

      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }
      const appUser: User = await response.json();

      const meRes = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullUser: User = meRes.ok ? await meRes.json() : appUser;

      onLogin(fullUser, fbUser);
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : err.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters.'
        : err.message || 'Signup failed';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Heart size={32} color="#f43f5e" fill="#f43f5e" />
          </div>
          <h1 className={styles.title}>Our Shared World</h1>
          <p className={styles.subtitle}>Create a space for just the two of us.</p>
        </div>
        <form onSubmit={handleSignup}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="love@example.com" required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button isLoading={loading} type="submit">Create Account</Button>
        </form>
        <p className={styles.footer}>
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className={styles.footerLink}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};