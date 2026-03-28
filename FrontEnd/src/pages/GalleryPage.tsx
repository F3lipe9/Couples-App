import React, { useState, useEffect } from 'react';
import { LogOut, Loader2, Camera, Plus, Trash2, X, CheckCircle2, Moon, Sun } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from '../firebase';
import { User, Photo, ViewType } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface GalleryPageProps {
  user: User;
  firebaseUser: FirebaseUser;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate: (view: ViewType) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  user,
  firebaseUser,
  darkMode,
  toggleDarkMode,
  onNavigate,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const t = darkMode
    ? {
        page:        'bg-slate-900',
        header:      'bg-slate-900/80 border-white/10',
        title:       'text-white',
        subtitle:    'text-slate-400',
        selectBtn:   'bg-white/10 text-slate-300 hover:bg-white/20',
        selectActive:'bg-rose-500/20 text-rose-400',
        signOutBtn:  'text-slate-400 hover:bg-white/10',
        card:        'bg-slate-800 border-slate-700',
        cardTitle:   'text-white',
        cardDesc:    'text-slate-400',
        cardImgBg:   'bg-slate-700',
        emptyIcon:   'bg-white/10',
        emptyTitle:  'text-slate-300',
        emptyDesc:   'text-slate-500',
        bottomBar:   'bg-slate-900 border-white/10',
        bottomText:  'text-slate-400',
        deleteDisabled: 'bg-white/10 text-slate-500',
        dialog:      'bg-slate-800',
        dialogTitle: 'text-white',
        dialogDesc:  'text-slate-400',
        dialogCancel:'border-white/10 text-slate-300 hover:bg-white/10',
      }
    : {
        page:        'bg-slate-50',
        header:      'bg-white/80 border-slate-200',
        title:       'text-slate-800',
        subtitle:    'text-slate-500',
        selectBtn:   'bg-slate-100 text-slate-600 hover:bg-slate-200',
        selectActive:'bg-rose-100 text-rose-600',
        signOutBtn:  'text-slate-400 hover:bg-slate-100',
        card:        'bg-white border-slate-100',
        cardTitle:   'text-slate-800',
        cardDesc:    'text-slate-500',
        cardImgBg:   'bg-slate-100',
        emptyIcon:   'bg-rose-100',
        emptyTitle:  'text-slate-700',
        emptyDesc:   'text-slate-500',
        bottomBar:   'bg-white border-slate-200',
        bottomText:  'text-slate-500',
        deleteDisabled: 'bg-slate-100 text-slate-400',
        dialog:      'bg-white',
        dialogTitle: 'text-slate-800',
        dialogDesc:  'text-slate-500',
        dialogCancel:'border-slate-200 text-slate-600 hover:bg-slate-50',
      };

  const fetchPhotos = async () => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${API_URL}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const handleSignOut = async () => {
    await signOut(firebaseAuth);
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelected(new Set());
  };

  const togglePhoto = (id: string) => {
    if (!selectMode) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      const token = await firebaseUser.getIdToken();
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`${API_URL}/photos/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error(err);
      alert('Failed to delete some photos. Please try again.');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className={`min-h-screen ${t.page} pb-32 relative overflow-hidden`}>
      {/* Dark mode background blobs — matching UnlockDatePage */}
      {darkMode && (
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-rose-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
        </div>
      )}

      {/* Header */}
      <header className={`${t.header} backdrop-blur-md sticky top-0 z-30 border-b px-6 py-4 flex items-center justify-between`}>
        <div>
          <h1 className={`text-xl font-bold ${t.title} font-serif`}>Our Memories</h1>
          <p className={`text-xs ${t.subtitle}`}>{photos.length} moments captured</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${t.signOutBtn}`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Select toggle */}
          <button
            onClick={toggleSelectMode}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectMode ? t.selectActive : t.selectBtn
            }`}
          >
            {selectMode ? (
              <span className="flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cancel
              </span>
            ) : (
              'Select'
            )}
          </button>

          {!selectMode && (
            <button
              onClick={handleSignOut}
              className={`p-2 rounded-full transition-colors ${t.signOutBtn}`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className={`w-20 h-20 ${t.emptyIcon} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Camera className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className={`text-lg font-medium ${t.emptyTitle}`}>No memories yet</h3>
            <p className={`${t.emptyDesc} mt-1`}>Tap the + button to add our first photo.</p>
          </div>
        ) : (
          photos.map((photo) => {
            const isSelected = selected.has(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => togglePhoto(photo.id)}
                className={`${t.card} rounded-2xl overflow-hidden shadow-sm border-2 transition-all group relative
                  ${selectMode ? 'cursor-pointer' : ''}
                  ${isSelected
                    ? 'border-rose-500 shadow-rose-500/20 shadow-md scale-[0.98]'
                    : ''
                  }`}
              >
                <div className={`aspect-[4/3] overflow-hidden ${t.cardImgBg} relative`}>
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <span className="text-white text-xs font-medium">
                      {new Date(photo.memoryDate).toLocaleDateString()}
                    </span>
                  </div>
                  {isSelected && (
                    <>
                      <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-6 h-6 text-rose-500 fill-white drop-shadow" />
                      </div>
                    </>
                  )}
                </div>
                <div className="p-4">
                  <h3 className={`font-semibold ${t.cardTitle} truncate`}>{photo.title}</h3>
                  {photo.description && (
                    <p className={`text-sm ${t.cardDesc} mt-1 line-clamp-2`}>{photo.description}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom bar — select mode */}
      {selectMode && (
        <div className={`fixed bottom-0 left-0 right-0 ${t.bottomBar} border-t px-6 py-4 flex items-center justify-between z-40 shadow-lg`}>
          <p className={`text-sm ${t.bottomText}`}>
            {selected.size === 0
              ? 'Tap photos to select'
              : `${selected.size} photo${selected.size > 1 ? 's' : ''} selected`}
          </p>
          <button
            onClick={() => selected.size > 0 && setShowConfirm(true)}
            disabled={selected.size === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selected.size > 0
                ? 'bg-red-500 text-white hover:bg-red-600'
                : t.deleteDisabled + ' cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Floating Add Button */}
      {!selectMode && (
        <button
          onClick={() => onNavigate('upload')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-rose-500 rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center text-white hover:bg-rose-600 transition-transform hover:scale-105 active:scale-95 z-40"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className={`${t.dialog} rounded-3xl p-6 w-full max-w-sm shadow-2xl`}>
            <h3 className={`text-lg font-bold ${t.dialogTitle} mb-2`}>
              Delete {selected.size} photo{selected.size > 1 ? 's' : ''}?
            </h3>
            <p className={`${t.dialogDesc} text-sm mb-6`}>
              This will permanently delete{' '}
              {selected.size > 1 ? 'these photos' : 'this photo'} and free up
              storage. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className={`flex-1 py-3 rounded-2xl border ${t.dialogCancel} font-medium transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Trash2 className="w-4 h-4" /> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};