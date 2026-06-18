export type ViewState = 'login' | 'setup' | 'dashboard' | 'admin' | 'settings';

export interface AppNotification {
  id: string;
  type: 'transfer_received' | 'transfer_sent' | 'system';
  amount?: number;
  senderId?: string;
  message?: string;
  timestamp: number;
  read: boolean;
}

export interface User {
  id: string;
  photoURL?: string;
  username?: string;
  email?: string;
  name: string;
  age?: string;
  country?: string;
  pin?: string;
  role: 'admin' | 'user';
  balance: number;
  currency?: string;
  card: {
    number: string;
    expiry: string;
    cvv: string;
    holderName: string;
    type?: string;
  };
  notifications?: AppNotification[];
}

