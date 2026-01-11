import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '../components';
import { User, ViewType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface SetSpecialDatePageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onNavigate: (view: ViewType) => void;
}

export const SetSpecialDatePage: React.FC<SetSpecialDatePageProps> = ({ 
  user, 
  onUpdateUser, 
  onNavigate 
}) => {
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialDate: date })
      });
      if (!response.ok) throw new Error('Update failed');
      const updated = await response.json();
      onUpdateUser(updated);
      onNavigate('login');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-rose-50">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center">
        <Calendar className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">When did it start?</h2>
        <p className="text-slate-500 mb-6">Pick the date that means the most to us. This will be our password to enter.</p>
        
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-4 text-center text-xl rounded-xl border-2 border-rose-200 focus:border-rose-500 outline-none bg-rose-50 text-slate-800 mb-6 font-semibold"
        />
        
        <Button onClick={handleSave} isLoading={loading}>Save Date</Button>
      </div>
    </div>
  );
};
