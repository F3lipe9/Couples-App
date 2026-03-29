export interface User {
  uid: string;
  email: string;
  isPremium: boolean;
  specialDate: string | null;
  storageUsedBytes: number;    // ← add this
  storageLimitBytes: number;   // ← add this
}

export interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  memoryDate: string;
  uploadDate: string;
}

export type ViewType = 'signup' | 'login' | 'set-date' | 'unlock' | 'gallery' | 'upload' | 'upgrade' | 'home';