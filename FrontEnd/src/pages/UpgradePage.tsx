import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Button } from '../components';
import { User, ViewType } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface UpgradePageProps {
  user: User;
  firebaseUser: FirebaseUser;
  onUpdateUser: (user: User) => void;
  onNavigate: (view: ViewType) => void;
}

export const UpgradePage: React.FC<UpgradePageProps> = ({
  user,
  firebaseUser,
  onUpdateUser,
  onNavigate,
}) => {
  const [processing, setProcessing] = useState(false);

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      const token = await firebaseUser.getIdToken();

      // Step 1: process mock payment
      const paymentRes = await fetch(`${API_URL}/users/${user.uid}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!paymentRes.ok) {
        const err = await paymentRes.json();
        throw new Error(err.detail || 'Payment failed');
      }

      // Step 2: fetch updated user (backend already set isPremium: true in /payment)
      const meRes = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) throw new Error('Failed to refresh user');
      const updated: User = await meRes.json();

      onUpdateUser(updated);
      onNavigate('gallery');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-rose-100 border border-rose-100 relative overflow-hidden">
        {/* Decorative shine */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-full opacity-20 blur-2xl" />

        <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-200 rotate-3">
          <Crown className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 font-serif mb-2">
          Unlock More Memories
        </h2>
        <p className="text-slate-500 mb-8">
          You've used your 50MB of free storage. Upgrade to Premium for 5GB —
          enough for thousands of photos of your story.
        </p>

        {/* Storage comparison */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">Free</p>
            <p className="text-lg font-bold text-slate-700">50MB</p>
            <p className="text-xs text-slate-400">~5–10 photos</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-2xl p-4 text-left border border-amber-100">
            <p className="text-xs text-amber-500 font-medium mb-1">Premium</p>
            <p className="text-lg font-bold text-amber-600">5GB</p>
            <p className="text-xs text-amber-400">~500–1000 photos</p>
          </div>
        </div>

        <ul className="text-left space-y-3 mb-8">
          <li className="flex items-center text-slate-700">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-xs">✓</div>
            5GB of photo storage
          </li>
          <li className="flex items-center text-slate-700">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-xs">✓</div>
            High-quality uploads up to 10MB each
          </li>
          <li className="flex items-center text-slate-700">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-xs">✓</div>
            Support future development
          </li>
        </ul>

        <Button
          onClick={handleUpgrade}
          isLoading={processing}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none shadow-amber-200"
        >
          Upgrade for $10/month
        </Button>
        <button
          onClick={() => onNavigate('gallery')}
          className="mt-4 text-sm text-slate-400 hover:text-slate-600"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};