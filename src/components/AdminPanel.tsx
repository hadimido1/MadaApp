import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Shield, Lock, Edit2, Coins, ArrowLeft, Search, Copy, Check, Key, Eye, EyeOff, UserCog, Unlock, Settings } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getTranslation } from '../i18n';
import logo from '../assets/images/regenerated_image_1781780076153.png';

interface AdminPanelProps {
  onNavigate?: (view: any) => void;
}

export function AdminPanel({ onNavigate }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [cardNumberInput, setCardNumberInput] = useState<string>('');
  const [cardExpiryInput, setCardExpiryInput] = useState<string>('');
  const [cardCvvInput, setCardCvvInput] = useState<string>('');
  const [cardPinInput, setCardPinInput] = useState<string>('');
  const [cardHolderInput, setCardHolderInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // States for Admin Secret password changer
  const [adminSecret, setAdminSecret] = useState('hh');
  const [newSecretInput, setNewSecretInput] = useState('');
  const [updatingSecret, setUpdatingSecret] = useState(false);
  const [showSecretSection, setShowSecretSection] = useState(false);
  const [showAdminSecretState, setShowAdminSecretState] = useState(false);
  const [showPcAdminCodeState, setShowPcAdminCodeState] = useState(false);

  // States for Quick User PIN/Password updates
  const [quickPinInputs, setQuickPinInputs] = useState<{[userId: string]: string}>({});
  const [updatingUserPin, setUpdatingUserPin] = useState<string | null>(null);

  // Dict to toggle reveal/hide for precise details of specific users
  const [revealedUsers, setRevealedUsers] = useState<{[key: string]: boolean}>({});

  const toggleUserReveal = (id: string) => {
    setRevealedUsers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      u.id.toLowerCase().includes(term) ||
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.country || '').toLowerCase().includes(term)
    );
  });

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
        console.error("Error fetching users", e);
      } finally {
        setLoading(false);
      }
    };

    const fetchAdminSecret = async () => {
      try {
        const docRef = doc(db, 'config', 'admin');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.secret) {
            setAdminSecret(data.secret);
          }
        }
      } catch (e) {
        console.error("Error fetching admin secret", e);
      }
    };

    fetchUsers();
    fetchAdminSecret();
  }, []);

  const handleSaveSecret = async () => {
    if (!newSecretInput.trim()) {
      alert(lang === 'ar' ? 'الرجاء كتابة كلمة مرور صحيحة' : 'Please enter a valid secret password');
      return;
    }
    setUpdatingSecret(true);
    try {
      const docRef = doc(db, 'config', 'admin');
      await setDoc(docRef, { secret: newSecretInput.trim() }, { merge: true });
      setAdminSecret(newSecretInput.trim());
      setNewSecretInput('');
      alert(lang === 'ar' ? 'تم تحديث كلمة سر الـ Admin بنجاح!' : 'Admin secret password updated successfully!');
    } catch (err) {
      console.error("Error saving admin secret:", err);
      alert(lang === 'ar' ? 'فشل تحديث كلمة السر' : 'Failed to update secret password');
    } finally {
      setUpdatingSecret(false);
    }
  };

  const handleUpdateUserPin = async (userId: string, newPin: string) => {
    if (newPin.trim().length !== 4 || isNaN(Number(newPin))) {
      alert(lang === 'ar' ? 'الرجاء إدخال PIN صحيح يتكون من 4 أرقام' : 'Please enter a valid 4-digit PIN');
      return;
    }
    setUpdatingUserPin(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { pin: newPin.trim() });
      
      // Update local state list instantly
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, pin: newPin.trim() } : u));
      
      // Clear specific quick pin inputs
      setQuickPinInputs(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      
      alert(lang === 'ar' ? 'تم تحديث كلمة مرور (PIN) المستخدم بنجاح!' : 'User card password (PIN) updated successfully!');
    } catch (err) {
      console.error("Error updating user PIN", err);
      alert(lang === 'ar' ? 'فشل تحديث كلمة المرور' : 'Failed to update user password');
    } finally {
      setUpdatingUserPin(null);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const parsedBalance = parseFloat(balanceInput);
      if (isNaN(parsedBalance)) {
        alert(lang === 'ar' ? 'الرجاء إدخال رقم رصيد صحيح' : 'Please enter a valid balance number');
        setSaving(false);
        return;
      }
      
      const userRef = doc(db, 'users', editingUser.id);
      const updatedFields = {
        balance: parsedBalance,
        pin: cardPinInput.trim() || '1234',
        card: {
          number: cardNumberInput.trim().replace(/\s/g, ''),
          expiry: cardExpiryInput.trim(),
          cvv: cardCvvInput.trim(),
          holderName: cardHolderInput.trim() || editingUser.name
        }
      };
      
      await updateDoc(userRef, updatedFields);

      // Update local state list instantly
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updatedFields } : u));
      setEditingUser(null);
      alert(lang === 'ar' ? 'تم تحديث بيانات المستخدم بنجاح!' : 'User details updated successfully!');
    } catch (err) {
      console.error("Failed to update user details:", err);
      alert(lang === 'ar' ? 'فشل تحديث البيانات في قاعدة البيانات' : 'Failed to update details in database');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full overflow-y-auto z-10 px-4 pt-12 pb-32 touch-pan-y">
      <div className="relative z-10 w-full max-w-4xl md:max-w-6xl mx-auto flex flex-col items-stretch">
        {/* Back button */}
        {onNavigate && (
          <div className="w-full flex justify-start mb-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all active:scale-95 light-mode-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'ar' ? 'رجوع' : 'Back'}</span>
            </button>
          </div>
        )}

        <div className="w-20 h-20 flex items-center justify-center mb-6 transition-transform hover:scale-110 self-center">
          <img src={logo} alt="AVBANK Icon" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 text-center tracking-tight light-mode-text">{t.usersList}</h1>
        <p className="text-gray-400 text-sm text-center mb-6 max-w-[280px] leading-relaxed font-medium self-center">
          {t.adminDesc}
        </p>

        {/* Admin Settings & Password Changer */}
        <div className="w-full bg-white/[0.02] border border-white/10 rounded-[28px] p-5 mb-6 shadow-xl light-mode-card">
          <button 
            onClick={() => setShowSecretSection(!showSecretSection)}
            className="w-full flex items-center justify-between text-sm font-bold text-gray-300 hover:text-white transition-colors py-1 px-2"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-accent animate-spin-slow" />
              <span>{lang === 'ar' ? 'إدارة جميع كلمات السر والتحكم الأمني' : 'Security & All Passwords Control'}</span>
            </div>
            <span className="text-xs text-gray-500">{showSecretSection ? '▲' : '▼'}</span>
          </button>
          
          {showSecretSection && (
            <div className="mt-5 pt-5 border-t border-white/5 flex flex-col gap-6 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              
              {/* SECTION A: Admin Secret Password */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-xs font-black text-white">{lang === 'ar' ? 'أولاً: كلمات مرور لوحة التحكم الخاصة بالأدمن' : '1. Admin Panel Passwords'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Trigger code "pcadmin" */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {lang === 'ar' ? 'رمز تفعيل الإدارة (Trigger Code)' : 'Activation / Trigger Code'}
                    </span>
                    <div className="bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl font-mono text-xs text-gray-300 flex items-center justify-between light-mode-bg">
                      <span className="tracking-widest font-black text-accent">
                        {showPcAdminCodeState ? 'pcadmin' : '•••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPcAdminCodeState(!showPcAdminCodeState)}
                        className="p-1 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        {showPcAdminCodeState ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 2. Admin Secret Password */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {lang === 'ar' ? 'كلمة السر الحالية للـ Admin' : 'Current Admin Password'}
                    </span>
                    <div className="bg-black/40 border border-white/5 px-3 py-2.5 rounded-xl font-mono text-xs text-gray-300 flex items-center justify-between light-mode-bg">
                      <span className="tracking-widest font-black text-accent">
                        {showAdminSecretState ? adminSecret : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAdminSecretState(!showAdminSecretState)}
                        className="p-1 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        {showAdminSecretState ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Change password form */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    {lang === 'ar' ? 'تغيير كلمة السر الحالية للـ Admin' : 'Change Secret Password'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={lang === 'ar' ? 'كلمة سر جديدة (مثال: master77)' : 'New password (e.g. master77)'}
                      value={newSecretInput}
                      onChange={(e) => setNewSecretInput(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 light-mode-bg light-mode-text"
                    />
                    <button 
                      onClick={handleSaveSecret}
                      disabled={updatingSecret || !newSecretInput.trim()}
                      className="px-4 bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-black text-xs rounded-xl transition-all active:scale-95 whitespace-nowrap flex items-center justify-center light-mode-btn"
                    >
                      {updatingSecret ? '...' : (lang === 'ar' ? 'حفظ' : 'Save')}
                    </button>
                  </div>
                </div>
                
                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                  {lang === 'ar' 
                    ? '💡 هذه هي كلمات السر المطلوبة للدخول كمسؤول وتأكيد الهوية. الرموز الافتراضية هي pcadmin وثم hh.' 
                    : '💡 These are the secret words required to authenticate. Default codes are pcadmin and then hh.'}
                </p>
              </div>

              {/* SECTION B: Users card PINs / Passwords list */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Key className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-black text-white">{lang === 'ar' ? 'ثانياً: كلمات مرور وبطاقات المستخدمين (Card PINs)' : '2. Users Card PINs / Passwords'}</span>
                </div>

                <p className="text-[10px] text-gray-400 leading-normal">
                  {lang === 'ar'
                    ? 'يمكنك تغيير وتحديث كلمة المرور (PIN) المكونة من 4 أرقام لأي مستخدم في ثوانٍ معدودة مباشرة من هنا:'
                    : 'You can quickly update the 4-digit PIN / card password of any user in seconds directly from here:'}
                </p>

                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {users.length === 0 ? (
                    <div className="text-center text-xs py-4 text-gray-500">
                      {lang === 'ar' ? 'لا يوجد مستخدمون حالياً' : 'No users available'}
                    </div>
                  ) : (
                    users.map(user => {
                      const currentVal = quickPinInputs[user.id] || '';
                      return (
                        <div key={user.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/35 border border-white/5 text-xs">
                          <div className="flex flex-col text-left font-sans">
                            <span className="font-bold text-white text-xs">{user.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono font-bold">
                              {lang === 'ar' ? 'الـ PIN الحالي: ' : 'Current PIN: '} 
                              <span className="text-yellow-400 font-black tracking-wider">{user.pin || '1234'}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="1234"
                              value={currentVal}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '');
                                setQuickPinInputs(prev => ({ ...prev, [user.id]: digits }));
                              }}
                              className="w-16 bg-black border border-white/15 focus:border-yellow-400 rounded-lg px-2 py-1.5 text-center font-mono text-xs text-white placeholder:text-gray-700 outline-none transition-colors"
                            />
                            <button
                              onClick={() => handleUpdateUserPin(user.id, currentVal)}
                              disabled={updatingUserPin === user.id || currentVal.length !== 4}
                              className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              {updatingUserPin === user.id ? '...' : (lang === 'ar' ? 'تحديث' : 'Update')}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="w-full relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder={lang === 'ar' ? 'البحث بالاسم، الايميل أو الـ ID...' : 'Search by Name, Email, or ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent/50 transition-colors shadow-inner light-mode-bg light-mode-text"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-xs text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-medium text-sm">
                {lang === 'ar' ? 'لم يتم العثور على مستخدمين' : 'No users found'}
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="bg-white/[0.03] border border-white/10 p-5 rounded-[28px] flex flex-col gap-4 shadow-lg light-mode-card">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-sm shadow-inner border border-white/5 light-mode-text">
                        {u.name?.substring(0,2) || 'US'}
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
                  
                  {/* Detailed attributes: Email & Copyable ID */}
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[11px] font-mono bg-black/40 border border-white/5 px-3 py-2 rounded-xl flex items-center justify-between text-gray-400 light-mode-bg">
                      <span className="truncate pr-2">ID: {u.id}</span>
                      <button 
                        onClick={() => handleCopyId(u.id)} 
                        className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                        title={lang === 'ar' ? 'نسخ الـ ID' : 'Copy ID'}
                      >
                        {copiedId === u.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-500 hover:text-white" />
                        )}
                      </button>
                    </div>

                    {u.email && (
                      <div className="text-[11px] font-mono bg-black/40 border border-white/5 px-3 py-2 rounded-xl text-gray-400 truncate flex items-center justify-between light-mode-bg">
                        <span>{lang === 'ar' ? 'الايميل: ' : 'Email: '}{u.email}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(u.email || '');
                            alert(lang === 'ar' ? 'تم نسخ الايميل!' : 'Email copied!');
                          }}
                          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                        >
                          <Copy className="w-3 h-3 text-gray-500 hover:text-white" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Toggle to reveal precise details */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
                    <button 
                      onClick={() => toggleUserReveal(u.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-accent hover:text-blue-300 transition-colors py-1"
                    >
                      <div className="flex items-center gap-1.5">
                        {revealedUsers[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{revealedUsers[u.id] ? (lang === 'ar' ? 'إخفاء البيانات الدقيقة للفيزا' : 'Hide Visa Credentials') : (lang === 'ar' ? 'إظهار البيانات الدقيقة للفيزا والـ PIN' : 'Reveal Visa Credentials & PIN')}</span>
                      </div>
                    </button>
                    
                    {revealedUsers[u.id] && (
                      <div className="pt-2 border-t border-white/5 flex flex-col gap-2 font-mono text-[11px] text-gray-300 text-left" dir="ltr">
                        <div className="flex justify-between items-center bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="text-gray-500">CARD NUM:</span>
                          <span className="text-white font-black tracking-wider">{u.card?.number || '---- ---- ---- ----'}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(u.card?.number || '');
                              alert(lang === 'ar' ? 'تم نسخ رقم البطاقة!' : 'Card number copied!');
                            }}
                            className="p-0.5 hover:bg-white/10 rounded"
                          >
                            <Copy className="w-3 h-3 text-gray-500 hover:text-white" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between items-center bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-gray-500">EXPIRY:</span>
                            <span className="text-white font-bold">{u.card?.expiry || 'MM/YY'}</span>
                          </div>
                          <div className="flex justify-between items-center bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span className="text-gray-500">CVV:</span>
                            <span className="text-white font-bold text-red-400">{u.card?.cvv || '***'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="text-gray-500">CARD PIN:</span>
                          <span className="text-yellow-400 font-black tracking-widest text-sm">{u.pin || '1234'}</span>
                          <span className="text-[9px] text-gray-500 font-sans">({lang === 'ar' ? 'كلمة سر البطاقة' : 'Card PIN/Password'})</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <span className="text-gray-500">HOLDER:</span>
                          <span className="text-white uppercase text-[10px] truncate max-w-[150px]">{u.card?.holderName || u.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="h-[1px] w-full bg-white/5"></div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-[10px] font-bold mb-1">{t.totalBalance}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-white light-mode-text">${(u.balance || 0).toFixed(2)}</span>
                        <button 
                          onClick={() => {
                            setEditingUser(u);
                            setBalanceInput((u.balance || 0).toString());
                            setCardNumberInput(u.card?.number || '');
                            setCardExpiryInput(u.card?.expiry || '');
                            setCardCvvInput(u.card?.cvv || '');
                            setCardPinInput(u.pin || '1234');
                            setCardHolderInput(u.card?.holderName || u.name || '');
                          }}
                          className="p-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg border border-accent/20 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-black light-mode-btn"
                          title={lang === 'ar' ? 'تعديل كامل البيانات' : 'Edit All Details'}
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تعديل البيانات' : 'Edit Details'}</span>
                        </button>
                      </div>
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
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit User Details Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-[32px] p-6 flex flex-col gap-4 shadow-2xl light-mode-card animate-slide-up my-8">
            <div className="flex justify-between items-center text-right">
              <button 
                onClick={() => setEditingUser(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors light-mode-btn text-white"
              >
                <span className="text-xs font-black text-gray-400">✕</span>
              </button>
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-white light-mode-text">
                  {lang === 'ar' ? 'تعديل بيانات الحساب بالكامل' : 'Edit Full Account Details'}
                </h3>
                <span className="text-gray-500 text-xs font-medium">{editingUser.name}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5"></div>

            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Balance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right pr-1">
                  {lang === 'ar' ? 'الرصيد الكلي الحالي ($)' : 'Current Total Balance ($)'}
                </label>
                <input 
                  type="number"
                  step="any"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-2.5 px-4 text-center font-mono text-base font-black text-white outline-none focus:border-accent/50 transition-colors shadow-inner light-mode-bg light-mode-text"
                />
                {/* Quick Balance options */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[50, 100, 5000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        const current = parseFloat(balanceInput) || 0;
                        setBalanceInput((current + amount).toFixed(2));
                      }}
                      className="py-1.5 px-2 bg-accent/10 hover:bg-accent/20 rounded-xl border border-accent/20 text-[10px] font-black text-accent transition-all active:scale-95 whitespace-nowrap"
                    >
                      +{amount}$
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right pr-1">
                  {lang === 'ar' ? 'رقم بطاقة الفيزا (16 رقم)' : 'Visa Card Number (16 digits)'}
                </label>
                <input 
                  type="text"
                  maxLength={16}
                  value={cardNumberInput}
                  onChange={(e) => setCardNumberInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="4000123456789010"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-2.5 px-4 text-center font-mono text-base font-bold text-white outline-none focus:border-accent/50 transition-colors shadow-inner light-mode-bg light-mode-text"
                />
              </div>

              {/* Card PIN/Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right pr-1">
                  {lang === 'ar' ? 'كلمة السر للبطاقة (PIN - 4 أرقام)' : 'Card PIN (4 digits)'}
                </label>
                <input 
                  type="text"
                  maxLength={4}
                  value={cardPinInput}
                  onChange={(e) => setCardPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-2.5 px-4 text-center font-mono text-base font-black text-yellow-400 outline-none focus:border-accent/50 transition-colors shadow-inner light-mode-bg"
                />
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right pr-1">
                    {lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry (MM/YY)'}
                  </label>
                  <input 
                    type="text"
                    maxLength={5}
                    placeholder="12/29"
                    value={cardExpiryInput}
                    onChange={(e) => setCardExpiryInput(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-2.5 px-4 text-center font-mono text-base text-white outline-none focus:border-accent/50 transition-colors shadow-inner light-mode-bg light-mode-text"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right pr-1">
                    {lang === 'ar' ? 'رمز الأمان (CVV)' : 'CVV'}
                  </label>
                  <input 
                    type="text"
                    maxLength={3}
                    placeholder="123"
                    value={cardCvvInput}
                    onChange={(e) => setCardCvvInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-2.5 px-4 text-center font-mono text-base text-red-400 outline-none focus:border-accent/50 transition-colors shadow-inner light-mode-bg"
                  />
                </div>
              </div>

              {/* Holder Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider text-right pr-1">
                  {lang === 'ar' ? 'اسم صاحب البطاقة' : 'Cardholder Name'}
                </label>
                <input 
                  type="text"
                  value={cardHolderInput}
                  onChange={(e) => setCardHolderInput(e.target.value)}
                  placeholder="JOHN DOE"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl py-2.5 px-4 text-center text-sm font-bold text-white uppercase outline-none focus:border-accent/50 transition-colors shadow-inner light-mode-bg light-mode-text"
                />
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5 mt-1"></div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingUser(null)}
                disabled={saving}
                className="flex-1 py-3 text-sm font-bold text-gray-400 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-[0.98] light-mode-btn"
              >
                {t.cancel}
              </button>
              
              <button
                onClick={handleSaveUser}
                disabled={saving || !balanceInput}
                className="flex-1 py-3 text-sm font-black text-black bg-white hover:bg-gray-100 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-white/5 disabled:opacity-50 light-mode-btn"
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin"></div>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>{t.save}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
