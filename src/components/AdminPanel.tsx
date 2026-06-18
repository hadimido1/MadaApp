import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Shield, Lock } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getTranslation } from '../i18n';
import logo from '../assets/images/regenerated_image_1781780076153.png';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: User[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as User);
        });
        setUsers(usersList);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="flex-1 flex flex-col relative w-full h-full overflow-y-auto z-10 px-4 pt-12 pb-32 touch-pan-y">
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center">
        <div className="w-20 h-20 flex items-center justify-center mb-6 transition-transform hover:scale-110">
          <img src={logo} alt="Mada Icon" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 text-center tracking-tight light-mode-text">{t.usersList}</h1>
        <p className="text-gray-400 text-sm text-center mb-10 max-w-[280px] leading-relaxed font-medium">
          {t.adminDesc}
        </p>

        {loading ? (
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {users.map(u => (
              <div key={u.id} className="bg-white/[0.03] border border-white/10 p-5 rounded-[28px] flex flex-col gap-4 shadow-lg light-mode-card">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-sm shadow-inner border border-white/5 light-mode-text">
                      {u.name.substring(0,2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-white light-mode-text">{u.name}</span>
                      <span className="text-gray-500 text-[11px] font-mono">{u.country} - {u.age}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black ${u.role === 'admin' ? 'bg-white text-black light-mode-btn' : 'bg-white/10 text-white light-mode-btn'}`}>
                    {u.role === 'admin' ? t.admin : t.account}
                  </span>
                </div>
                
                <div className="h-[1px] w-full bg-white/5"></div>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px] font-bold mb-1">{t.totalBalance}</span>
                    <span className="font-mono text-sm font-black text-white light-mode-text">${(u.balance || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 text-[10px] font-bold mb-1">{t.cardStatus}</span>
                    <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/10 shadow-inner light-mode-bg" dir="ltr">
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono text-gray-300 text-xs tracking-widest font-bold light-mode-text">
                        **** {u.card?.number?.slice(-4) || '----'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
