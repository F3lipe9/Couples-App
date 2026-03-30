import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Button, Input, StorageBar, Navbar } from '../components/index';
import { User, ViewType } from '../types';
import styles from '../styles/UploadPage.module.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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

  const d = darkMode;
  const cx = (...cs: string[]) => cs.filter(Boolean).join(' ');

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.uid, url: preview, title, description, memoryDate: date }),
      });
      if (!response.ok) {
        const error = await response.json();
        if (error.detail === 'storage_limit_reached') { onNavigate('upgrade'); return; }
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
    <div className={cx(styles.page, d ? styles.pageDark : styles.pageLight)}>
      {d && (
        <div className={styles.blobs}>
          <div className={styles.blobTopLeft} />
          <div className={styles.blobBottomRight} />
        </div>
      )}

      <header className={cx(styles.header, d ? styles.headerDark : styles.headerLight)}>
        <button onClick={() => onNavigate('gallery')} className={cx(styles.closeBtn, d ? styles.closeBtnDark : styles.closeBtnLight)}>
          <X size={24} />
        </button>
        <h1 className={cx(styles.headerTitle, d ? styles.headerTitleDark : styles.headerTitleLight)}>
          New Memory
        </h1>
      </header>

      <form onSubmit={handleUpload} className={styles.form}>
        <div className={styles.imagePickerWrap}>
          <label className={cx(
            styles.imagePicker,
            preview ? styles.imagePickerWithPreview : (d ? styles.imagePickerDark : styles.imagePickerLight)
          )}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {preview ? (
              <>
                <img src={preview} alt="Preview" className={styles.previewImg} />
                <div className={styles.imagePickerOverlay}>
                  <p className={styles.imagePickerOverlayText}>Change Photo</p>
                </div>
              </>
            ) : (
              <>
                <ImageIcon size={40} className={d ? styles.imagePickerTextDark : styles.imagePickerTextLight} />
                <p className={cx(styles.imagePickerText, d ? styles.imagePickerTextDark : styles.imagePickerTextLight)}>
                  Select a photo
                </p>
                <p className={cx(styles.imagePickerSubtext, d ? styles.imagePickerSubtextDark : styles.imagePickerSubtextLight)}>
                  Max 10MB
                </p>
              </>
            )}
          </label>
        </div>

        <Input label="Title" placeholder="e.g. Our trip to Paris" value={title} onChange={e => setTitle(e.target.value)} required />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />

        <div className={styles.descWrap}>
          <label className={cx(styles.descLabel, d ? styles.descLabelDark : styles.descLabelLight)}>
            Description (Optional)
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What made this moment special?"
            className={cx(styles.descTextarea, d ? styles.descTextareaDark : styles.descTextareaLight)}
          />
        </div>

        <div className={styles.storageWrap}>
          <StorageBar usedBytes={user.storageUsedBytes} limitBytes={user.storageLimitBytes} isPremium={user.isPremium} />
        </div>

        <Button type="submit" isLoading={loading}>Add to Gallery</Button>
      </form>

      <Navbar variant="full" currentView="upload" darkMode={darkMode} toggleDarkMode={() => {}} onNavigate={onNavigate} />
    </div>
  );
};