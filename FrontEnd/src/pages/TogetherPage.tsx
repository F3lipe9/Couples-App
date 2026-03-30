import React, { useState, useEffect } from 'react';
import { Loader2, Camera, Pencil } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Navbar } from '../components/index';
import { User, Photo, ViewType } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface TogetherPageProps {
  user: User;
  firebaseUser: FirebaseUser;
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

function calcDuration(specialDate: string): { years: number; months: number; days: number } {
  const start = new Date(specialDate);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

export const TogetherPage: React.FC<TogetherPageProps> = ({
  user,
  firebaseUser,
  darkMode,
  toggleDarkMode,
  currentView,
  onNavigate,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(() =>
    localStorage.getItem('couple_cover_photo_id')
  );
  const [picking, setPicking] = useState(false);

  const coverPhoto = photos.find((p) => p.id === coverPhotoId) ?? photos[0] ?? null;
  const duration = user.specialDate ? calcDuration(user.specialDate) : null;

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${API_URL}/photos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setPhotos(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [user.uid]);

  const selectCover = (photo: Photo) => {
    setCoverPhotoId(photo.id);
    localStorage.setItem('couple_cover_photo_id', photo.id);
    setPicking(false);
  };

  // ── Theme tokens ────────────────────────────────────────────────────────
  const t = darkMode
    ? {
        page:       'bg-slate-900',
        header:     'bg-slate-900/90 border-white/10',
        title:      'text-white',
        cancelBtn:  'text-slate-400 hover:bg-white/10',
        emptyBg:    'bg-white/10',
        emptyText:  'text-white/50',
        emptyBtn:   'text-white/70 border-white/20 hover:bg-white/10',
        pencilBtn:  'bg-black/30 hover:bg-black/50 text-white/70 hover:text-white',
      }
    : {
        page:       'bg-rose-50',
        header:     'bg-white/90 border-slate-200',
        title:      'text-slate-800',
        cancelBtn:  'text-slate-500 hover:bg-slate-100',
        emptyBg:    'bg-rose-100',
        emptyText:  'text-slate-400',
        emptyBtn:   'text-slate-600 border-slate-300 hover:bg-slate-100',
        pencilBtn:  'bg-white/60 hover:bg-white/80 text-slate-600 hover:text-slate-800',
      };

  // ── Photo picker overlay ─────────────────────────────────────────────────
  if (picking) {
    return (
      <div className={`min-h-screen ${t.page} pb-24`}>
        <header className={`sticky top-0 z-30 border-b backdrop-blur-md px-6 py-4 flex items-center justify-between ${t.header}`}>
          <h1 className={`text-lg font-semibold ${t.title}`}>Choose a photo</h1>
          <button
            onClick={() => setPicking(false)}
            className={`text-sm px-3 py-1.5 rounded-full transition-colors ${t.cancelBtn}`}
          >
            Cancel
          </button>
        </header>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => selectCover(photo)}
              className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                photo.id === coverPhotoId
                  ? 'border-rose-500 scale-[0.97]'
                  : 'border-transparent hover:border-rose-300'
              }`}
            >
              <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <Navbar
          variant="full"
          currentView={currentView}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  // ── Main page ────────────────────────────────────────────────────────────
  // When a cover photo is set: always full-screen photo regardless of theme
  // When no photo: background matches theme
  const hasPhoto = !loading && coverPhoto;

  return (
    <div className={`min-h-screen relative overflow-hidden ${hasPhoto ? 'bg-slate-900' : t.page}`}>

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      )}

      {/* Full screen photo */}
      {hasPhoto && (
        <img
          src={coverPhoto!.url}
          alt={coverPhoto!.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient overlay — only when photo is showing */}
      {hasPhoto && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none" />
      )}

      {/* Empty state — no photos yet */}
      {!loading && !coverPhoto && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pb-24">
          <div className={`w-20 h-20 ${t.emptyBg} rounded-full flex items-center justify-center`}>
            <Camera className={`w-8 h-8 ${t.emptyText}`} />
          </div>
          <p className={`${t.emptyText} text-sm`}>No photos yet</p>
          <button
            onClick={() => onNavigate('upload')}
            className={`text-sm border px-4 py-2 rounded-full transition-colors ${t.emptyBtn}`}
          >
            Upload a photo
          </button>
        </div>
      )}

      {/* Change photo button — top right */}
      {photos.length > 0 && (
        <button
          onClick={() => setPicking(true)}
          className={`absolute top-5 right-5 z-20 p-2 rounded-full transition-colors ${t.pencilBtn}`}
          title="Change photo"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {/* Together counter */}
      {duration && (
        <div className={`absolute bottom-24 left-0 right-0 text-center z-10 px-6`}>
          <p className={`text-xs tracking-[0.15em] uppercase mb-3 ${hasPhoto ? 'text-white/60' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Together for
          </p>
          <div className="flex items-end justify-center gap-6">
            {[
              { value: duration.years, label: duration.years === 1 ? 'Year' : 'Years' },
              { value: duration.months, label: duration.months === 1 ? 'Month' : 'Months' },
              { value: duration.days, label: duration.days === 1 ? 'Day' : 'Days' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && (
                  <p className={`text-3xl leading-none mb-2 ${hasPhoto ? 'text-white/30' : darkMode ? 'text-slate-700' : 'text-slate-300'}`}>·</p>
                )}
                <div className="text-center">
                  <p className={`text-5xl font-light leading-none ${hasPhoto ? 'text-white' : darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {item.value}
                  </p>
                  <p className={`text-xs tracking-widest uppercase mt-2 ${hasPhoto ? 'text-white/50' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {item.label}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        variant="full"
        currentView={currentView}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onNavigate={onNavigate}
      />
    </div>
  );
};