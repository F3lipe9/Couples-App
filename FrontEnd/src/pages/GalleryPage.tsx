import React, { useState, useEffect } from 'react';
import { LogOut, Loader2, Camera, Plus } from 'lucide-react';
import { User, Photo, ViewType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface GalleryPageProps {
  user: User;
  onNavigate: (view: ViewType) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ user, onNavigate }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`${API_URL}/photos/${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      const data = await response.json();
      setPhotos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [user.uid]);

  const handleSignOut = () => {
    // In real app, call firebase signOut
    onNavigate('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-serif">Our Memories</h1>
          <p className="text-xs text-slate-500">{photos.length} moments captured</p>
        </div>
        <button onClick={handleSignOut} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="w-8 h-8 text-rose-400 animate-spin" /></div>
        ) : photos.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700">No memories yet</h3>
            <p className="text-slate-500 mt-1">Tap the + button to add our first photo.</p>
          </div>
        ) : (
          photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                 <img src={photo.url} alt={photo.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                 <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <span className="text-white text-xs font-medium">{new Date(photo.memoryDate).toLocaleDateString()}</span>
                 </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate">{photo.title}</h3>
                {photo.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{photo.description}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => onNavigate('upload')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-rose-500 rounded-full shadow-lg shadow-rose-300 flex items-center justify-center text-white hover:bg-rose-600 transition-transform hover:scale-105 active:scale-95 z-40"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};
