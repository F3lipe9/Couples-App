import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Button, Input, StorageBar } from '../components/index';
import { User, ViewType } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface UploadPageProps {
  user: User;
  firebaseUser: FirebaseUser;
  darkMode: boolean;
  onNavigate: (view: ViewType) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ user, firebaseUser, darkMode, onNavigate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // ── Theme tokens ────────────────────────────────────────────────────────
  const t = darkMode
    ? {
        page:        'bg-slate-900',
        header:      'bg-slate-900/80 border-white/10',
        headerClose: 'text-slate-400 hover:bg-white/10',
        headerTitle: 'text-white',
        label:       'text-slate-400',
        textarea:    'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500 focus:ring-rose-500/20',
        imagePicker: 'bg-slate-800 border-slate-700 hover:border-rose-500',
        imageText:   'text-slate-400',
        imageSubtext:'text-slate-500',
      }
    : {
        page:        'bg-white',
        header:      'bg-white/90 border-slate-100',
        headerClose: 'text-slate-500 hover:bg-slate-100',
        headerTitle: 'text-slate-800',
        label:       'text-slate-600',
        textarea:    'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-rose-400 focus:ring-rose-100',
        imagePicker: 'bg-slate-50 border-slate-300 hover:border-rose-400',
        imageText:   'text-slate-500',
        imageSubtext:'text-slate-400',
      };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      alert(`Photo is too large. Please choose a photo under 10MB. (Yours is ${(selected.size / 1024 / 1024).toFixed(1)}MB)`);
      e.target.value = '';
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !date || !preview) return;
    setLoading(true);

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${API_URL}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          url: preview,
          title,
          description,
          memoryDate: date,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.detail === 'storage_limit_reached') {
          onNavigate('upgrade');
          return;
        }
        throw new Error(error.detail || 'Upload failed');
      }

      onNavigate('gallery');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${t.page} flex flex-col relative overflow-hidden`}>
      {/* Dark mode background blobs */}
      {darkMode && (
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-rose-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
        </div>
      )}

      <header className={`px-4 py-4 flex items-center border-b ${t.header} sticky top-0 backdrop-blur z-20`}>
        <button
          onClick={() => onNavigate('gallery')}
          className={`p-2 -ml-2 ${t.headerClose} rounded-full transition-colors`}
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className={`ml-2 font-semibold text-lg ${t.headerTitle}`}>New Memory</h1>
      </header>

      <form onSubmit={handleUpload} className="p-6 flex-1 max-w-lg mx-auto w-full relative z-10">
        {/* Image Picker */}
        <div className="mb-6">
          <label
            className={`aspect-[4/3] rounded-2xl border-2 border-dashed ${
              preview ? 'border-transparent' : t.imagePicker
            } flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative group`}
          >
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-medium">Change Photo</p>
                </div>
              </>
            ) : (
              <>
                <ImageIcon className={`w-10 h-10 ${t.imageText} mb-2`} />
                <p className={`${t.imageText} font-medium`}>Select a photo</p>
                <p className={`${t.imageSubtext} text-xs mt-1`}>Max 10MB</p>
              </>
            )}
          </label>
        </div>

        <Input
          label="Title"
          placeholder="e.g. Our trip to Paris"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div className="mb-8">
          <label className={`block text-sm font-medium ${t.label} mb-1.5 ml-1`}>
            Description (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What made this moment special?"
            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all resize-none ${t.textarea}`}
          />
        </div>

        <div className="mb-6">
          <StorageBar
            usedBytes={user.storageUsedBytes}
            limitBytes={user.storageLimitBytes}
            isPremium={user.isPremium}
          />
        </div>

        <Button type="submit" isLoading={loading}>
          Add to Gallery
        </Button>
      </form>
    </div>
  );
};