import React, { useState, useEffect } from 'react';
import { Loader2, Camera, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Navbar } from '../components/index';
import { User, Photo, ViewType } from '../types';
import styles from '../styles/GalleryPage.module.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

interface GalleryPageProps {
  user: User;
  firebaseUser: FirebaseUser;
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  user, firebaseUser, darkMode, toggleDarkMode, currentView, onNavigate,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const d = darkMode;
  const cx = (...cs: string[]) => cs.filter(Boolean).join(' ');

  const fetchPhotos = async () => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${API_URL}/photos`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch photos');
      setPhotos(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPhotos(); }, [user.uid]);

  const toggleSelectMode = () => { setSelectMode(p => !p); setSelected(new Set()); };

  const togglePhoto = (id: string) => {
    if (!selectMode) return;
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      const token = await firebaseUser.getIdToken();
      await Promise.all(Array.from(selected).map(id =>
        fetch(`${API_URL}/photos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      ));
      setPhotos(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
      setSelectMode(false);
    } catch (err) { console.error(err); alert('Failed to delete some photos. Please try again.'); }
    finally { setDeleting(false); setShowConfirm(false); }
  };

  return (
    <div className={cx(styles.page, d ? styles.pageDark : styles.pageLight)}>

      {d && (
        <div className={styles.blobs}>
          <div className={styles.blobTopLeft} />
          <div className={styles.blobBottomRight} />
        </div>
      )}

      {/* Header */}
      <header className={cx(styles.header, d ? styles.headerDark : styles.headerLight)}>
        <div>
          <h1 className={cx(styles.headerTitle, d ? styles.headerTitleDark : styles.headerTitleLight)}>
            Our Memories
          </h1>
          <p className={cx(styles.headerSubtitle, d ? styles.headerSubtitleDark : styles.headerSubtitleLight)}>
            {photos.length} moments captured
          </p>
        </div>
        <button
          onClick={toggleSelectMode}
          className={cx(
            styles.selectBtn,
            selectMode
              ? (d ? styles.selectBtnActiveDark : styles.selectBtnActiveLight)
              : (d ? styles.selectBtnDark : styles.selectBtnLight)
          )}
        >
          {selectMode ? <><X size={14} /> Cancel</> : 'Select'}
        </button>
      </header>

      {/* Grid */}
      <div className={styles.grid}>
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 size={32} className="text-rose-400 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className={styles.empty}>
            <div className={cx(styles.emptyIconWrap, d ? styles.emptyIconWrapDark : styles.emptyIconWrapLight)}>
              <Camera size={32} color="#fb7185" />
            </div>
            <h3 className={cx(styles.emptyTitle, d ? styles.emptyTitleDark : styles.emptyTitleLight)}>
              No memories yet
            </h3>
            <p className={cx(styles.emptyDesc, d ? styles.emptyDescDark : styles.emptyDescLight)}>
              Tap the + button to add our first photo.
            </p>
          </div>
        ) : photos.map(photo => {
          const isSelected = selected.has(photo.id);
          return (
            <div
              key={photo.id}
              onClick={() => togglePhoto(photo.id)}
              className={cx(
                styles.card,
                d ? styles.cardDark : styles.cardLight,
                selectMode ? styles.cardSelectable : '',
                isSelected ? styles.cardSelected : ''
              )}
            >
              <div className={cx(styles.cardImgWrap, d ? styles.cardImgBgDark : styles.cardImgBgLight)}>
                <img src={photo.url} alt={photo.title} className={styles.cardImg} />
                <div className={styles.cardDateOverlay}>
                  <span className={styles.cardDate}>{new Date(photo.memoryDate).toLocaleDateString()}</span>
                </div>
                {isSelected && (
                  <>
                    <div className={styles.cardSelectedOverlay} />
                    <div className={styles.cardCheckmark}>
                      <CheckCircle2 size={24} color="#f43f5e" fill="white" />
                    </div>
                  </>
                )}
              </div>
              <div className={styles.cardBody}>
                <h3 className={cx(styles.cardTitle, d ? styles.cardTitleDark : styles.cardTitleLight)}>
                  {photo.title}
                </h3>
                {photo.description && (
                  <p className={cx(styles.cardDesc, d ? styles.cardDescDark : styles.cardDescLight)}>
                    {photo.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Select bottom bar */}
      {selectMode && (
        <div className={cx(styles.bottomBar, d ? styles.bottomBarDark : styles.bottomBarLight)}>
          <p className={cx(styles.bottomBarText, d ? styles.bottomBarTextDark : styles.bottomBarTextLight)}>
            {selected.size === 0 ? 'Tap photos to select' : `${selected.size} photo${selected.size > 1 ? 's' : ''} selected`}
          </p>
          <button
            onClick={() => selected.size > 0 && setShowConfirm(true)}
            disabled={selected.size === 0}
            className={cx(
              styles.deleteBtn,
              selected.size > 0
                ? styles.deleteBtnActive
                : (d ? styles.deleteBtnDisabledDark : styles.deleteBtnDisabledLight)
            )}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      {/* FAB */}
      {!selectMode && (
        <button onClick={() => onNavigate('upload')} className={styles.fab}>
          <Plus size={28} />
        </button>
      )}

      <Navbar variant="full" currentView={currentView} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={onNavigate} />

      {/* Confirm dialog */}
      {showConfirm && (
        <div className={styles.dialogOverlay}>
          <div className={cx(styles.dialog, d ? styles.dialogDark : styles.dialogLight)}>
            <h3 className={cx(styles.dialogTitle, d ? styles.dialogTitleDark : styles.dialogTitleLight)}>
              Delete {selected.size} photo{selected.size > 1 ? 's' : ''}?
            </h3>
            <p className={cx(styles.dialogDesc, d ? styles.dialogDescDark : styles.dialogDescLight)}>
              This will permanently delete {selected.size > 1 ? 'these photos' : 'this photo'} and free up storage. This cannot be undone.
            </p>
            <div className={styles.dialogButtons}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className={cx(styles.dialogCancelBtn, d ? styles.dialogCancelBtnDark : styles.dialogCancelBtnLight)}
              >
                Cancel
              </button>
              <button onClick={handleDeleteConfirmed} disabled={deleting} className={styles.dialogDeleteBtn}>
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};