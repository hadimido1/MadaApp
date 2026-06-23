export type ViewState = 'login' | 'setup' | 'dashboard' | 'admin' | 'settings' | 'store' | 'upgrade';

export interface StorePackage {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
}

export interface StoreProduct {
  id: string;
  name: string;
  category: 'giftcard' | 'game_topup';
  image: string;
  brand: 'google_play' | 'playstation' | 'steam' | 'xbox' | 'amazon' | 'pubg' | 'free_fire' | 'roblox' | 'shein';
  packages: StorePackage[];
}

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
  card?: {
    number: string;
    expiry: string;
    cvv: string;
    holderName: string;
  };
  cardLevel?: number;
  notifications?: AppNotification[];
}

