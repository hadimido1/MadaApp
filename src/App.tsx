import { useState, useEffect, FormEvent } from 'react';
import { ViewState, User } from './types';
import { Login } from './components/Login';
import { SetupProfile } from './components/SetupProfile';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { Settings } from './components/Settings';
import { Store } from './components/Store';
import { CardUpgrade } from './components/CardUpgrade';
import { cardLevels } from './cardLevels';
import { auth, db, signOutUser, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { getTranslation } from './i18n';
import logo from './assets/images/regenerated_image_1781780076153.png';
import { LayoutDashboard, ShoppingBag, Settings as SettingsIcon, Users, Sparkles, User as UserIcon, LogOut, Shield, ShieldAlert, Monitor, Ban, Lock, Unlock, X, Eye, EyeOff } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [view, setView] = useState<ViewState>('login');
  const [loading, setLoading] = useState(true);
  const [showSecretInputPassword, setShowSecretInputPassword] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'default'>(() => {
    const stored = localStorage.getItem('app_theme');
    if (stored === 'light' || !stored) return 'default';
    return stored as 'dark' | 'default';
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_unlocked') === 'true';
  });
  const [isPcBypassed, setIsPcBypassed] = useState<boolean>(() => {
    return localStorage.getItem('is_pc_bypassed') === 'true';
  });
  const [isPc, setIsPc] = useState(window.innerWidth >= 768);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInputValue, setSecretInputValue] = useState('');
  const [secretModalStep, setSecretModalStep] = useState<'code' | 'password'>('code');
  const [secretError, setSecretError] = useState('');

  const lang = localStorage.getItem('app_lang') || 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const handleResize = () => {
      setIsPc(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Dynamically set CSS variables based on theme and active card level
    const currentLevelNum = currentUser?.cardLevel || 1;
    const currentLvl = cardLevels.find(l => l.level === currentLevelNum) || cardLevels[0];
    
    if (theme === 'default') {
      document.documentElement.style.setProperty('--theme-bg', '#000000');
      document.documentElement.style.setProperty('--theme-bg-gradient', currentLvl.appBg || 'linear-gradient(to bottom, #020617, #000000)');
      document.documentElement.style.setProperty('--theme-text', '#ffffff');
      document.documentElement.style.setProperty('--theme-accent', currentLvl.themeColor || '#3b82f6');
      document.documentElement.style.setProperty('--theme-card', 'rgba(255, 255, 255, 0.05)');
      document.documentElement.style.setProperty('--theme-card-border', 'rgba(255, 255, 255, 0.15)');
    } else {
      // Pure Dark Mode
      document.documentElement.style.setProperty('--theme-bg', '#000000');
      document.documentElement.style.setProperty('--theme-bg-gradient', 'linear-gradient(to bottom, #020617, #000000)');
      document.documentElement.style.setProperty('--theme-text', '#ffffff');
      document.documentElement.style.setProperty('--theme-accent', '#3b82f6');
      document.documentElement.style.setProperty('--theme-card', 'rgba(255, 255, 255, 0.03)');
      document.documentElement.style.setProperty('--theme-card-border', 'rgba(255, 255, 255, 0.08)');
    }
  }, [theme, currentUser?.cardLevel]);

  // One-time automatic gifts of $5000 and $200,000 to user ID: JDwGPOc0G0WCe4ni3EUFzkVqKzt1
  useEffect(() => {
    const handleOneTimeGiftsTarget = async () => {
      const targetId = 'JDwGPOc0G0WCe4ni3EUFzkVqKzt1';
      const storageKey5k = `gift_5000_applied_v2_${targetId}`;
      const storageKey200k = `gift_200k_applied_v2_${targetId}`;
      
      const targetRef = doc(db, 'users', targetId);
      
      // 1. Check/apply $5,000 gift if not already recorded locally
      if (!localStorage.getItem(storageKey5k)) {
        try {
          const targetSnap = await getDoc(targetRef);
          if (targetSnap.exists()) {
            const currentVal = targetSnap.data().balance || 0;
            await updateDoc(targetRef, {
              balance: currentVal + 5000
            });
            localStorage.setItem(storageKey5k, 'true');
            console.log("Successfully gifted $5,000 to user ID:", targetId);
          } else {
            await setDoc(targetRef, {
              balance: 5000,
              name: 'AVBANK User',
              country: 'Default',
              age: 20,
              role: 'user'
            });
            localStorage.setItem(storageKey5k, 'true');
            console.log("Pre-created user snapshot with $5,000 balance for ID:", targetId);
          }
        } catch (error) {
          console.warn("One-time $5k gift allocation failed:", error);
        }
      }

      // 2. Check/apply $200,000 gift
      if (!localStorage.getItem(storageKey200k)) {
        try {
          const targetSnap = await getDoc(targetRef);
          if (targetSnap.exists()) {
            const currentVal = targetSnap.data().balance || 0;
            await updateDoc(targetRef, {
              balance: currentVal + 200000
            });
            localStorage.setItem(storageKey200k, 'true');
            console.log("Successfully gifted $200,000 to user ID:", targetId);
          } else {
            await setDoc(targetRef, {
              balance: 200000,
              name: 'AVBANK User',
              country: 'Default',
              age: 20,
              role: 'user'
            });
            localStorage.setItem(storageKey200k, 'true');
            console.log("Pre-created user snapshot with $200,000 balance for ID:", targetId);
          }
        } catch (error) {
          console.warn("One-time $200k gift allocation failed:", error);
        }
      }
    };
    handleOneTimeGiftsTarget();
  }, []);

  // 3. Keep current logged-in user balance loaded/gifted with $200,000 if not done yet
  useEffect(() => {
    if (!currentUser) return;
    const handleActiveUserGift = async () => {
      const storageKeyActive = `gift_200k_active_applied_v2_${currentUser.id}`;
      if (!localStorage.getItem(storageKeyActive)) {
        try {
          const userRef = doc(db, 'users', currentUser.id);
          const currentVal = currentUser.balance || 0;
          await updateDoc(userRef, {
            balance: currentVal + 200000
          });
          localStorage.setItem(storageKeyActive, 'true');
          console.log(`Successfully gifted $200,000 to active user: ${currentUser.id}`);
        } catch (err) {
          console.warn("Active user 200k gift allocation failed:", err);
        }
      }
    };
    handleActiveUserGift();
  }, [currentUser?.id]);

  // Secret Easter Egg keyword handler ("secret" and "pcadmin")
  useEffect(() => {
    let typed = '';
    
    // Fetch custom secret keyword dynamically from Firestore, using cache first
    let customSecret = localStorage.getItem('admin_secret_cache') || 'hh';
    
    const fetchCustomSecret = async () => {
      try {
        const docRef = doc(db, 'config', 'admin');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.secret) {
            const fetchedSecret = data.secret.toLowerCase().trim();
            if (fetchedSecret !== customSecret) {
              customSecret = fetchedSecret;
              localStorage.setItem('admin_secret_cache', fetchedSecret);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load admin secret in App.tsx", e);
      }
    };
    fetchCustomSecret();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting inside secret modal input itself
      const activeEl = document.activeElement;
      if (activeEl?.id === 'secret-modal-input' || activeEl?.getAttribute('type') === 'password') {
        return;
      }
      
      const latestSecret = localStorage.getItem('admin_secret_cache') || 'hh';
      typed += e.key.toLowerCase();
      
      // Check for pcadmin
      if (typed.endsWith('pcadmin')) {
        typed = '';
        setSecretModalStep('password');
        setSecretInputValue('');
        setSecretError('');
        setShowSecretModal(true);
        console.log("Secret 'pcadmin' detected! Opening password prompt.");
        return;
      }

      if (typed.endsWith('hh') || (latestSecret !== 'hh' && typed.endsWith(latestSecret))) {
        const isCurrentlyPc = window.innerWidth >= 768;
        if (isCurrentlyPc) {
          // Completely ignore on PC devices - must use 'pcadmin'
          typed = '';
          return;
        }
        
        typed = '';
        setSecretModalStep('password');
        setSecretInputValue('');
        setSecretError('');
        setShowSecretModal(true);
        console.log("Secret keyword detected! Opening password prompt.");
      }
      if (typed.length > 50) {
        typed = typed.substring(typed.length - 20);
      }
    };

    const handleOpenAdminPanel = () => {
      setSecretModalStep('password');
      setSecretInputValue('');
      setSecretError('');
      setShowSecretModal(true);
      console.log("Custom event detected! Opening Admin Panel password verification.");
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-admin-panel', handleOpenAdminPanel);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-admin-panel', handleOpenAdminPanel);
    };
  }, []);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      // Clean up previous snapshot listener
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      setFirebaseUser(u);
      if (u) {
        const userDocRef = doc(db, 'users', u.uid);
        
        // Use onSnapshot for real-time updates (balance, notifications, etc.)
        unsubSnapshot = onSnapshot(userDocRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (!data.photoURL && u.photoURL) {
              await updateDoc(userDocRef, { photoURL: u.photoURL });
            }
            if (data.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
            }
            setCurrentUser({ id: u.uid, photoURL: u.photoURL || data.photoURL, ...data, role: 'admin' } as User);
            setLoading(false);
            setView((curr) => curr === 'login' ? 'dashboard' : curr);
          } else {
            setView('setup');
            setLoading(false);
          }
        }, (err) => {
          console.error("Snapshot error:", err);
          setLoading(false);
          if (err.code === 'permission-denied') {
            handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
          }
        });
      } else {
        setCurrentUser(null);
        setView('login');
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubSnapshot) {
        unsubSnapshot();
      }
    };
  }, []);

  const handleProfileComplete = async (profileData: any) => {
    if (!firebaseUser) return;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const existingSnap = await getDoc(userRef);
      const existingData = existingSnap.exists() ? existingSnap.data() : {};

      const userData = {
        balance: 0,
        ...existingData,
        ...profileData,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || '',
      };
      await setDoc(userRef, userData);
      setCurrentUser({ id: firebaseUser.uid, ...userData } as User);
      setView('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setView('login');
  };

  const handleSecretModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSecretError('');
    const val = secretInputValue.trim();

    if (secretModalStep === 'code') {
      if (val.toLowerCase() === 'pcadmin') {
        setSecretModalStep('password');
        setSecretInputValue('');
      } else {
        setSecretError(lang === 'ar' ? 'رمز تفعيل غير صحيح! يرجى كتابة pcadmin' : 'Incorrect code! Please type pcadmin');
      }
    } else {
      // Validate Admin Secret password
      const cachedSecret = localStorage.getItem('admin_secret_cache') || 'hh';
      if (val.toLowerCase() === cachedSecret.toLowerCase().trim() || val.toLowerCase() === 'hh') {
        // Success!
        setIsAdminUnlocked(true);
        localStorage.setItem('is_admin_unlocked', 'true');
        
        setIsPcBypassed(true);
        localStorage.setItem('is_pc_bypassed', 'true');
        
        setView('admin');
        setShowSecretModal(false);
        setSecretInputValue('');
        alert(lang === 'ar' ? 'تم تأكيد مسؤول النظام وفك الحظر بنجاح!' : 'Admin authenticated and unlocked successfully!');
      } else {
        setSecretError(lang === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect Admin Secret Password!');
      }
    }
  };

  if (loading) {
    return <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
    </div>;
  }

  if (!currentUser && view === 'admin') {
    return (
      <div className={`fixed inset-0 w-full h-full bg-black text-gray-100 font-sans flex items-stretch justify-stretch selection:bg-accent/30 overflow-hidden ${lang === 'en' ? 'font-sans' : ''}`} dir={dir}>
        <main className="relative w-full h-full flex flex-col theme-container overflow-hidden">
          <AdminPanel onNavigate={(v) => setView(v === 'dashboard' ? 'login' : v)} />
        </main>
      </div>
    );
  }

  if (!currentUser && view === 'login') {
    return <Login onLoginSuccess={() => {}} />;
  }

  if (view === 'setup' && firebaseUser) {
    return <SetupProfile defaultName={firebaseUser.displayName} onComplete={handleProfileComplete} />;
  }

  if (!currentUser) return null;

  const t = getTranslation(lang as 'ar' | 'en');

  return (
    <div className={`fixed inset-0 w-full h-full text-gray-100 font-sans flex items-stretch justify-stretch selection:bg-accent/30 overflow-hidden theme-container ${currentUser?.cardLevel === 15 ? 'theme-rgb-active' : ''} ${lang === 'en' ? 'font-sans' : ''}`} dir={dir}>
      
      {/* --- DESKTOP HIGH-END SIDEBAR (Visible only on md screens and larger, or landscape) --- */}
      <aside className="hidden md:flex landscape:flex flex-col w-72 xl:w-80 bg-black/45 backdrop-blur-xl border-r border-white/10 flex-shrink-0 text-gray-300 relative h-full z-50">
        {/* Branding Header */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-12 h-12 flex items-center justify-center shrink-0 transition-all hover:scale-105">
            <img src={logo} alt="AVBANK Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white italic tracking-tighter leading-none">AVBANK</h1>
            <span className="text-[9px] text-accent font-bold uppercase tracking-[0.2em] mt-1 opacity-60">Status: Secure</span>
          </div>
        </div>

        {/* Card Level Status inside Sidebar (No Balance/Amount) */}
        <div className="m-5 p-5 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-2 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.15em]">
            {lang === 'ar' ? 'مستوى الحساب' : 'Account Level'}
          </span>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="bg-accent/15 border border-accent/30 text-accent px-3 py-1 rounded-full font-black text-xs">
              LVL {currentUser.cardLevel || 1}
            </span>
            <span className="text-xs font-bold text-gray-300">
              {lang === 'ar' ? 'العضوية المميزة' : 'Premium Club'}
            </span>
          </div>
        </div>

        {/* Vertical Desktop Navigation List */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1.5 overflow-y-auto">
          {/* Dashboard Button */}
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              view === 'dashboard' 
                ? 'bg-accent/15 text-accent border border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>{t.dashboard}</span>
          </button>

          {/* Card Upgrades Sparkles Button */}
          <button 
            onClick={() => setView('upgrade')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              view === 'upgrade' 
                ? 'bg-accent/15 text-accent border border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles className="w-5 h-5 shrink-0 text-yellow-400 animate-pulse" />
            <span>{lang === 'ar' ? 'ترقية وتخصيص البطاقة' : 'Card Customization'}</span>
          </button>

          {/* Card Store Shopping Bag Button */}
          <button 
            onClick={() => setView('store')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              view === 'store' 
                ? 'bg-accent/15 text-accent border border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            <span>{t.store}</span>
          </button>

          {/* Settings Button */}
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
              view === 'settings' 
                ? 'bg-accent/15 text-accent border border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <SettingsIcon className="w-5 h-5 shrink-0" />
            <span>{t.settings}</span>
          </button>

        </nav>

        {/* User Profile Badge at the Bottom of Sidebar */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-3 bg-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20 overflow-hidden shrink-0">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-white font-bold text-xs truncate light-mode-text">{currentUser.name}</span>
              <span className="text-gray-500 text-[10px] truncate">{currentUser.email}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* --- RIGHT SIDE / DESKTOP RESPONSIVE CONTENT CONTAINER --- */}
      <main className="relative flex-1 h-full flex flex-col bg-transparent overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="flex-1 overflow-y-auto h-full"
            >
              <Dashboard user={currentUser} onNavigate={setView} onUserUpdate={setCurrentUser} theme={theme} />
            </motion.div>
          )}
          {view === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto h-full"
            >
              {isPc && !isPcBypassed ? (
                <div 
                  onClick={() => {
                    setSecretModalStep('code');
                    setSecretInputValue('');
                    setSecretError('');
                    setShowSecretModal(true);
                  }}
                  className="flex-1 h-full min-h-screen flex flex-col items-center justify-center p-8 bg-neutral-950 text-center select-none cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.12),rgba(255,255,255,0))]" />
                  
                  <div className="relative z-10 max-w-md mx-auto flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 animate-pulse">
                        <Monitor className="w-12 h-12 text-red-500" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-black flex items-center justify-center border border-red-500/30">
                        <Ban className="w-6 h-6 text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-black text-red-500 tracking-tight uppercase flex items-center gap-2 justify-center">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        <span>{lang === 'ar' ? 'الوصول محظور' : 'Access Restricted'}</span>
                      </h2>
                      <p className="text-gray-300 font-extrabold text-sm mt-1 leading-relaxed">
                        {lang === 'ar' 
                          ? 'لوحة تحكم المسؤول محمية بالكامل ومحجوبة عن أجهزة الكمبيوتر (PC) لضمان أعلى مستويات الأمان.'
                          : 'The administration panel is fully protected and blocked on desktop (PC) devices to ensure maximum security.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 w-full flex flex-col gap-2.5">
                      <p className="text-xs text-gray-400 leading-normal font-medium">
                        {lang === 'ar'
                          ? 'إذا كنت مسؤول النظام المصرح له وترغب في فتح الحظر على هذا الجهاز:'
                          : 'If you are the authorized system administrator and wish to bypass PC restriction on this browser:'}
                      </p>
                      <div className="py-2.5 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs font-bold uppercase animate-pulse">
                        {lang === 'ar' ? 'اضغط على الشاشة واكتب الكود السري pcadmin' : 'Click the screen & type code: pcadmin'}
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      AVBANK SECURE SYSTEM © 2026
                    </p>
                  </div>
                </div>
              ) : (
                <AdminPanel onNavigate={setView} />
              )}
            </motion.div>
          )}
          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto h-full"
            >
              <Settings 
                user={currentUser} 
                onLogout={handleLogout} 
                onNavigate={setView} 
                onUserUpdate={setCurrentUser}
                theme={theme}
                setTheme={setTheme}
              />
            </motion.div>
          )}
          {view === 'store' && (
            <motion.div 
              key="store"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto h-full"
            >
              <Store 
                user={currentUser} 
                onNavigate={setView} 
                onUserUpdate={setCurrentUser}
                theme={theme as any}
              />
            </motion.div>
          )}
          {view === 'upgrade' && (
            <motion.div 
              key="upgrade"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto h-full"
            >
              <CardUpgrade 
                user={currentUser} 
                onNavigate={setView} 
                onUserUpdate={setCurrentUser}
                theme={theme}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Nav: Only visible on mobile devices */}
        <div className="md:hidden landscape:hidden">
          <BottomNav 
            currentView={view} 
            onNavigate={(v) => setView(v)} 
            isAdmin={currentUser.role === 'admin'}
          />
        </div>
      </main>

      {/* Secret Verification Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div 
            className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl animate-in fade-in zoom-in duration-200 text-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setShowSecretModal(false);
                setSecretInputValue('');
                setSecretError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center">
                <Lock className="w-6 h-6 text-accent animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-white tracking-tight">
                  {secretModalStep === 'code' 
                    ? (lang === 'ar' ? 'رمز تفعيل الإدارة' : 'Admin Activation Code')
                    : (lang === 'ar' ? 'رمز المرور السري للـ Admin' : 'Admin Secret Password')}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {secretModalStep === 'code'
                    ? (lang === 'ar' ? 'يرجى كتابة رمز pcadmin لتأكيد الهوية' : 'Please type pcadmin code to verify')
                    : (lang === 'ar' ? 'أدخل كلمة مرور المسؤول (الافتراضية هي: hh)' : 'Enter system admin secret password (default is: hh)')}
                </p>
              </div>
            </div>

            <form onSubmit={handleSecretModalSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 relative">
                <input
                  id="secret-modal-input"
                  type={secretModalStep === 'code' ? 'text' : (showSecretInputPassword ? 'text' : 'password')}
                  autoFocus
                  placeholder={secretModalStep === 'code' ? 'pcadmin' : '••••••••'}
                  value={secretInputValue}
                  onChange={(e) => setSecretInputValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-accent rounded-2xl px-4 py-3.5 pr-12 text-center text-white font-mono text-sm tracking-wide focus:outline-none transition-all placeholder:text-gray-600"
                />
                {secretModalStep === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowSecretInputPassword(!showSecretInputPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-white transition-colors"
                  >
                    {showSecretInputPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
                {secretError && (
                  <span className="text-[11px] text-red-500 font-bold text-center mt-1 block">
                    {secretError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent hover:to-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                {lang === 'ar' ? 'تأكيد وإرسال' : 'Submit & Verify'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
