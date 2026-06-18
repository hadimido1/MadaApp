import { User } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'أحمد محمد',
    role: 'admin',
    balance: 0,
    card: {
      number: '4532  8834  1245  9012',
      expiry: '12/28',
      cvv: '123',
      holderName: 'AHMED MOHAMED',
    }
  },
  {
    id: '2',
    username: 'user1',
    name: 'محمود علي',
    role: 'user',
    balance: 0,
    card: {
      number: '4532  1122  3344  5566',
      expiry: '05/26',
      cvv: '456',
      holderName: 'MAHMOUD ALI',
    }
  }
];
