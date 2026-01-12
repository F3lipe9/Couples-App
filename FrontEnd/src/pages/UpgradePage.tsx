import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { Button } from '../components';
import { User, ViewType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UpgradePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onNavigate: (view: ViewType) => void;
}

export const UpgradePage: React.FC<UpgradePageProps> = ({ 
  user, 
  onUpdateUser, 
  onNavigate 
}) => {
  const [processing, setProcessing] = useState(false);

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      // Simulate Stripe checkout
      await fetch(`${API_URL}/users/${user.uid}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await fetch(`${API_URL}/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: true })
      });
      
      if (!response.ok) throw new Error('Upgrade failed');
      const updated = await response.json();
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
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-full opacity-20 blur-2xl"></div>

        <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-200 rotate-3">
          <Crown className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 font-serif mb-2">Unlock Unlimited Memories</h2>
        <p className="text-slate-500 mb-8">
          You've filled your first 100 pages! Upgrade to Premium to keep adding unlimited photos to our story forever.
        </p>

        <ul className="text-left space-y-3 mb-8">
          <li className="flex items-center text-slate-700">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-xs">✓</div>
            Unlimited photo uploads
          </li>
          <li className="flex items-center text-slate-700">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-xs">✓</div>
            High-quality storage
          </li>
          <li className="flex items-center text-slate-700">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 text-xs">✓</div>
            Support future development
          </li>
        </ul>

        <Button onClick={handleUpgrade} isLoading={processing} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none shadow-amber-200">
          Upgrade for $4.99/year
        </Button>
        <button onClick={() => onNavigate('gallery')} className="mt-4 text-sm text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  );
};
