import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button, Input } from '../components';
import { User, ViewType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UploadPageProps {
  user: User;
  onNavigate: (view: ViewType) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ user, onNavigate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !date || !preview) return;
    setLoading(true);

    try {
      // Compress/Read file as base64 for MongoDB storage
      // In production, use cloud storage like AWS S3 or Cloudinary
      const response = await fetch(`${API_URL}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          url: preview,
          title,
          description,
          memoryDate: date
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (error.detail === 'limit_reached') {
          onNavigate('upgrade');
          return;
        }
        throw new Error(error.detail || 'Upload failed');
      }
      
      onNavigate('gallery');
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-4 py-4 flex items-center border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-20">
        <button onClick={() => onNavigate('gallery')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <h1 className="ml-2 font-semibold text-lg text-slate-800">New Memory</h1>
      </header>
      
      <form onSubmit={handleUpload} className="p-6 flex-1 max-w-lg mx-auto w-full">
        {/* Image Picker */}
        <div className="mb-6">
          <label className={`aspect-[4/3] rounded-2xl border-2 border-dashed ${preview ? 'border-transparent' : 'border-slate-300 hover:border-rose-400'} bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative group`}>
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
                 <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                 <p className="text-slate-500 font-medium">Select a photo</p>
               </>
             )}
          </label>
        </div>

        <Input label="Title" placeholder="e.g. Our trip to Paris" value={title} onChange={e => setTitle(e.target.value)} required />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Description (Optional)</label>
          <textarea 
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What made this moment special?"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all text-slate-800 bg-white resize-none"
          />
        </div>

        <Button type="submit" isLoading={loading}>
          Add to Gallery
        </Button>
      </form>
    </div>
  );
};
