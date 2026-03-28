import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { Heart } from 'lucide-react';
import { Button, Input } from '../components';
import { User, ViewType } from '../types';

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
      // 1. Create Firebase Auth user via client SDK
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();

      // 2. Create the Firestore user doc via our API
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

      // 3. Fetch the full user from /me using the token
      //    (ensures storageUsedBytes / storageLimitBytes are included)
      const meRes = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullUser: User = meRes.ok ? await meRes.json() : appUser;

      onLogin(fullUser, fbUser);
    } catch (err: any) {
      // Surface friendly Firebase error messages
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-rose-100 border border-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Our Shared World</h1>
          <p className="text-slate-500 mt-2">Create a space for just the two of us.</p>
        </div>
        <form onSubmit={handleSignup}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="love@example.com" required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button isLoading={loading} type="submit">Create Account</Button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-rose-500 font-semibold hover:underline">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};