import { useState, useEffect } from 'react';
import { ViewState, User } from './types';
import { Login } from './components/Login';
import { SetupProfile } from './components/SetupProfile';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { Settings } from './components/Settings';
import { auth, db, signOutUser } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [view, setView] = useState<ViewState>('login');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(localStorage.getItem('app_theme') as 'dark' | 'light' || 'light');

  const lang = localStorage.getItem('app_lang') || 'en';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u) {
        const userDocRef = doc(db, 'users', u.uid);
        
        // Use onSnapshot for real-time updates (balance, notifications, etc.)
        const unsubSnapshot = onSnapshot(userDocRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (!data.photoURL && u.photoURL) {
              try {
                await updateDoc(userDocRef, { photoURL: u.photoURL });
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `users/${u.uid}`);
              }
            }
            setCurrentUser({ id: u.uid, photoURL: u.photoURL || data.photoURL, ...data } as User);
            setLoading(false);
            if (view === 'login') setView('dashboard');
          } else {
            setView('setup');
            setLoading(false);
          }
        }, (err) => {
          console.error("Snapshot error:", err);
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
          setLoading(false);
        });

        return () => unsubSnapshot();
      } else {
        setCurrentUser(null);
        setView('login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Remove [view] dependency to avoid re-subscribing on view change

  const handleProfileComplete = async (profileData: any) => {
    if (!firebaseUser) return;
    try {
      const userData = {
        ...profileData,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || '',
      };
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, userData);
      setCurrentUser({ id: firebaseUser.uid, ...userData } as User);
      setView('dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setView('login');
  };

  if (loading) {
    return <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
    </div>;
  }

  if (!currentUser && view === 'login') {
    return <Login onLoginSuccess={() => {}} />;
  }

  if (view === 'setup' && firebaseUser) {
    return <SetupProfile defaultName={firebaseUser.displayName} onComplete={handleProfileComplete} />;
  }

  if (!currentUser) return null;

  return (
    <div className={`fixed inset-0 w-full h-full bg-black text-gray-100 font-sans flex flex-col selection:bg-blue-500/30 overflow-hidden ${lang === 'en' ? 'font-sans' : ''} light-mode-bg`} dir={dir}>
      <main className="relative flex-1 w-full max-w-md mx-auto h-full flex flex-col bg-black shadow-2xl border-x border-white/10 overflow-hidden light-mode-bg">
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
              <AdminPanel />
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
        </AnimatePresence>

        <BottomNav 
          currentView={view} 
          onNavigate={(v) => setView(v)} 
          isAdmin={currentUser.role === 'admin'}
        />
      </main>
    </div>
  );
}
