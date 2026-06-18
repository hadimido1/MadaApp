import React, { useState, useEffect } from 'react';
import { User as UserIcon, Trash2, Mail, Lock } from 'lucide-react';
import { signInWithGoogle, signUpWithEmail, signInWithEmail, db } from '../firebase';
import { getTranslation } from '../i18n';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import logo from '../assets/images/regenerated_image_1781780076153.png';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function Login({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  
  // Email Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem('recent_users');
    if (saved) {
      try {
        const users = JSON.parse(saved);
        setRecentUsers(users);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToRecent = (user: any) => {
    const freshRecent = [
      { 
        email: user.email, 
        name: user.name || user.displayName || user.email?.split('@')[0], 
        photoURL: user.photoURL, 
        id: user.uid || user.id
      },
      ...recentUsers.filter(u => u.email !== user.email)
    ].slice(0, 3);
    localStorage.setItem('recent_users', JSON.stringify(freshRecent));
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const user = await signInWithGoogle();
      saveToRecent(user);
      onLoginSuccess(user);
    } catch (err) {
      setError(t.loginError);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    
    try {
      let firebaseUser;
      if (isRegistering) {
        firebaseUser = await signUpWithEmail(email, password);
        // Create initial user document if it's a new sign up
        const userRef = doc(db, 'users', firebaseUser.uid);
        const newUser: User = {
          id: firebaseUser.uid,
          name: email.split('@')[0],
          email: email,
          photoURL: '',
          role: 'user',
          balance: 200, // Welcome bonus for email signup
          currency: 'USD',
          notifications: [],
          card: {
            number: Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000)).join(' '),
            holderName: email.split('@')[0].toUpperCase(),
            expiry: '12/28',
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            type: 'gold'
          }
        };
        await setDoc(userRef, newUser);
      } else {
        firebaseUser = await signInWithEmail(email, password);
      }
      
      saveToRecent(firebaseUser);
      onLoginSuccess(firebaseUser);
    } catch (err: any) {
      console.error(err);
      if (err.code?.startsWith('auth/')) {
        setError(err.message || 'Authentication failed');
      } else {
        handleFirestoreError(err, OperationType.WRITE, `users/${email}`);
      }
      setLoading(false);
    }
  };

  const removeRecent = (e: React.MouseEvent, userIdx: number) => {
    e.stopPropagation();
    const newRecent = recentUsers.filter((_, i) => i !== userIdx);
    setRecentUsers(newRecent);
    localStorage.setItem('recent_users', JSON.stringify(newRecent));
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 relative overflow-hidden light-mode-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[340px] relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 mb-6 flex items-center justify-center transition-all hover:scale-110 duration-500">
          <img src={logo} alt="Mada Icon" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1 italic light-mode-text">Mada</h1>
        <p className="text-gray-600 text-[10px] mb-10 text-center font-bold uppercase tracking-[0.4em]">Premium Financial enclave</p>

        {/* Email Login Form */}
        <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-3 mb-6">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="email" 
              placeholder={lang === 'ar' ? "البريد الإلكتروني" : "Email Address"} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-5 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-all light-mode-card light-mode-text"
              required
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="password" 
              placeholder={lang === 'ar' ? "كلمة المرور" : "Password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-5 py-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 transition-all light-mode-card light-mode-text"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-[24px] shadow-[0_20px_40px_rgba(59,130,246,0.2)] transition-all active:scale-[0.98] text-sm disabled:opacity-50 mt-2"
          >
            {loading ? '...' : (isRegistering ? (lang === 'ar' ? 'إنشاء حساب' : 'Create Account') : (lang === 'ar' ? 'تسجيل دخول' : 'Sign In'))}
          </button>

          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 hover:text-white transition-colors"
          >
            {isRegistering ? 
              (lang === 'ar' ? "لديك حساب؟ سجل دخول" : "Already have an account? Sign In") : 
              (lang === 'ar' ? "ليس لديك حساب؟ سجل الآن" : "New here? Get started")}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 mb-6 opacity-20">
          <div className="h-px flex-1 bg-white"></div>
          <span className="text-[10px] text-white font-bold">OR</span>
          <div className="h-px flex-1 bg-white"></div>
        </div>

        {recentUsers.length > 0 && (
          <div className="w-full mb-8">
            <p className="text-white text-[10px] font-black mb-4 opacity-40 uppercase tracking-[0.2em] text-center light-mode-text">{t.quickSwitch}</p>
            <div className="flex flex-col gap-3">
              {recentUsers.map((u, i) => (
                <div 
                  key={i} 
                  onClick={() => handleGoogleLogin()}
                  className="flex items-center justify-between p-4 rounded-[28px] bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden light-mode-card"
                >
                  <div className={`absolute inset-0 bg-gradient-to-${lang === 'ar' ? 'l' : 'r'} from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className={`flex items-center gap-4 relative z-10 ${lang === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-105 transition-transform light-mode-card">
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-blue-400" />}
                    </div>
                    <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className="text-white text-sm font-black group-hover:text-blue-400 transition-colors light-mode-text">{u.name || (lang === 'ar' ? 'مستخدم Mada' : 'Mada User')}</span>
                      <span className="text-gray-500 text-[9px] font-mono opacity-60">{u.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => removeRecent(e, i)}
                    className="p-2.5 text-gray-700 hover:text-red-500 transition-all rounded-full hover:bg-white/5 relative z-20"
                    title={t.remove}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-black py-4 rounded-[24px] shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-3 disabled:opacity-70 group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="tracking-tight">{t.loginWithGoogle}</span>
        </button>

        {error && <p className="text-red-400 text-[10px] font-bold text-center mt-6 p-4 bg-red-400/10 rounded-2xl w-full border border-red-400/20">{error}</p>}
      </div>
    </div>
  );
}
