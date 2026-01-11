export interface User {
  uid: string;
  email: string;
  isPremium: boolean;
  specialDate: string | null;
}

export interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  memoryDate: string;
  uploadDate: string;
}

export type ViewType = 'signup' | 'login' | 'set-date' | 'unlock' | 'gallery' | 'upload' | 'upgrade';
