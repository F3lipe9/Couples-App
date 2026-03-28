import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { Button, Input } from '../components';
import { User, ViewType } from '../types';

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
      // Sign in via Firebase client SDK
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();

      // Fetch app user from our API
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
      // Surface friendly Firebase error messages
      const msg = err.code === 'auth/invalid-credential'
        ? 'Incorrect email or password.'
        : err.message || 'Login failed';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-rose-100 border border-white">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Enter our shared world.</p>
        </div>
        <form onSubmit={handleLogin}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button isLoading={loading} type="submit">Log In</Button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-500">
          No account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-rose-500 font-semibold hover:underline">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};